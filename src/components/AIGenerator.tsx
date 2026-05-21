import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle, Plus, Search } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface Suggestion {
  kw: string;
  sub: string;
  rationale: string;
}

interface AIGeneratorProps {
  onSearch: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  onSave: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  session: any;
}

// executeClientSideLLM removed — app now always uses server-side GEMINI_API_KEY via Vercel /api/generate


export function AIGenerator({ onSearch, onSave, session }: AIGeneratorProps) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setError("");
    setSuggestions([]);

    // Always use cloud tier — GEMINI_API_KEY is securely stored on the server (Vercel env vars)
    const provider = "gemini";

    try {
      let data: any = null;

      try {
        // Call Vercel Serverless Function — key is read server-side from process.env.GEMINI_API_KEY
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idea: idea.trim(),
            provider,
          }),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          let errText = "";
          try { errText = await response.text(); } catch (_) {}
          throw new Error(errText || `Server error HTTP ${response.status}`);
        }
      } catch (fetchErr: any) {
        throw fetchErr;
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format received from AI. Please try again.");
      }

      setSuggestions(data);

      // Save to Supabase (ai_chats table)
      if (session?.user?.id) {
        const { error: chatError } = await supabase.from('ai_chats').insert([{
          user_id: session.user.id,
          prompt: idea.trim(),
          response: JSON.stringify(data),
          provider: provider
        }]);
        if (chatError) console.error("Error saving chat history:", chatError);
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "Something went wrong while generating recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-card" style={{ marginBottom: 36, border: "1px solid rgba(139, 92, 246, 0.15)", background: "radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 60%), var(--bg-glass)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "rgba(139, 92, 246, 0.15)",
              color: "var(--accent-purple)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              AI "Idea-to-Keyword" Generator
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Enter what you're building or researching. Our AI will analyze your concept and generate targeted Reddit keyword trackers.
            </p>
          </div>
        </div>
        
        {/* Settings Shortcut Button commented out for free tier deployment
        <button
          onClick={onOpenSettings}
          title="Configure AI API settings"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-light)",
            borderRadius: 8,
            padding: 8,
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-purple)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.05)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "var(--border-light)";
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          }}
        >
          <Settings size={14} />
          AI Setup
        </button>
        */}
      </div>

      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea
          className="input-field"
          style={{ minHeight: 70, resize: "vertical", paddingTop: 12, paddingBottom: 12 }}
          placeholder="e.g. I am building a mobile calorie tracking app that scans receipts... or I'm doing research on remote work developer fatigue..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          disabled={loading}
        />
        
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className="search-btn"
            style={{
              padding: "0 24px",
              minWidth: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-purple) 100%)",
              boxShadow: "0 4px 15px -5px rgba(139, 92, 246, 0.3)",
              border: "none",
            }}
            disabled={loading || !idea.trim()}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" style={{ animation: "pulse 1s linear infinite" }} />
                Generating Trackers...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Presets
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Output */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#f87171",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            marginTop: 16,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Generation Failed</div>
            <p style={{ lineHeight: 1.4, opacity: 0.9 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 80,
                background: "rgba(255, 255, 255, 0.01)",
                border: "1px solid var(--border-light)",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                opacity: 0.5,
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 120, height: 16, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                <div style={{ width: 60, height: 16, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
              </div>
              <div style={{ width: "80%", height: 14, background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Display */}
      {suggestions.length > 0 && !loading && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: 12, fontWeight: 600 }}>
            Generated Reddit Trackers
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggestions.map((item, index) => (
              <div
                key={index}
                style={{
                  background: "rgba(255, 255, 255, 0.01)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-purple)";
                  e.currentTarget.style.background = "rgba(139, 92, 246, 0.02)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      "{item.kw}"
                    </span>
                    <span style={{ fontSize: 11, background: "rgba(139, 92, 246, 0.08)", color: "var(--accent-purple)", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
                      r/{item.sub}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {item.rationale}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onSearch({ kw: item.kw, sub: item.sub, sort: "relevance", time: "month", limit: 25 })}
                    title="Search this query"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.borderColor = "var(--border-light)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    <Search size={14} />
                  </button>
                  <button
                    onClick={() => onSave({ kw: item.kw, sub: item.sub, sort: "relevance", time: "month", limit: 25 })}
                    title="Save to Trackers"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: "rgba(255, 69, 0, 0.08)",
                      border: "1px solid rgba(255, 69, 0, 0.15)",
                      color: "var(--accent-orange)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(255, 69, 0, 0.15)";
                      e.currentTarget.style.borderColor = "var(--accent-orange)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(255, 69, 0, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(255, 69, 0, 0.15)";
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
