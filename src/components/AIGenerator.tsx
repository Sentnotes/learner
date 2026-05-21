import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle, Plus, Search, Settings } from "lucide-react";

interface Suggestion {
  kw: string;
  sub: string;
  rationale: string;
}

interface AIGeneratorProps {
  onSearch: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  onSave: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  onOpenSettings: () => void;
}

async function executeClientSideLLM(idea: string, provider: "gemini" | "openai", apiKey: string): Promise<Suggestion[]> {
  const systemInstruction = 
    "You are an expert market research and SEO assistant. The user will describe a product idea, niche, or topic they are interested in. " +
    "Analyze this idea and generate a list of 4 to 6 highly targeted search queries (keywords) paired with highly relevant subreddits " +
    "where potential customers or communities discuss pain points, needs, or alternatives related to this product. " +
    "Output your response strictly as a valid, raw JSON array of objects, with no markdown backticks, no comments, and no explanation. " +
    "Each object in the array MUST contain exactly these three string fields: " +
    "1. \"kw\": a short search query/keyword (e.g. \"competitor alternative\" or \"productivity tracker\"). " +
    "2. \"sub\": a highly relevant, active subreddit name without the r/ prefix (e.g. \"indiehackers\" or \"SaaS\"). " +
    "3. \"rationale\": a short 1-sentence explanation of why this community and keyword are valuable for tracking. " +
    "Example Output: " +
    "[{\"kw\":\"habit builder\",\"sub\":\"productivity\",\"rationale\":\"Tracks discussions of habit tracking software and struggles.\"}]";

  const promptText = `Generate custom keyword trackers for this product idea:\n"${idea}"`;

  let resultJsonText = "";

  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction + " Wrap the outer array in an object: {\"suggestions\": [...] }" },
          { role: "user", content: promptText },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `OpenAI API Error: HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errorMsg += ` - ${errJson.error.message}`;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const openAiData = await response.json();
    const rawContent = openAiData.choices[0].message.content;
    const parsedWrapper = JSON.parse(rawContent);
    const suggestionsArray = parsedWrapper.suggestions || (Array.isArray(parsedWrapper) ? parsedWrapper : null);
    if (!suggestionsArray) {
      throw new Error("Invalid structure returned from OpenAI model.");
    }
    resultJsonText = JSON.stringify(suggestionsArray);

  } else {
    // Gemini Direct API call
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${promptText}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Gemini API Error: HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errorMsg += ` - ${errJson.error.message}`;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const geminiData = await response.json();
    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Empty response or blocked safety settings from Gemini API.");
    }
    resultJsonText = geminiData.candidates[0].content.parts[0].text;
  }

  // Clean JSON markup
  let cleanedJsonText = resultJsonText.trim();
  if (cleanedJsonText.startsWith("```json")) {
    cleanedJsonText = cleanedJsonText.slice(7);
  } else if (cleanedJsonText.startsWith("```")) {
    cleanedJsonText = cleanedJsonText.slice(3);
  }
  if (cleanedJsonText.endsWith("```")) {
    cleanedJsonText = cleanedJsonText.slice(0, -3);
  }
  cleanedJsonText = cleanedJsonText.trim();

  let parsedData = JSON.parse(cleanedJsonText);
  if (parsedData && !Array.isArray(parsedData) && typeof parsedData === "object") {
    // In case it's wrapped in an object
    const keys = Object.keys(parsedData);
    for (const k of keys) {
      if (Array.isArray(parsedData[k])) {
        parsedData = parsedData[k];
        break;
      }
    }
  }

  if (!Array.isArray(parsedData)) {
    throw new Error("The AI model response did not return a valid array of suggestions.");
  }

  // Map and sanitize fields
  const formatted: Suggestion[] = parsedData.map((item: any) => ({
    kw: String(item.kw || item.keyword || "").trim(),
    sub: String(item.sub || item.subreddit || "").trim().replace(/^r\//, ""),
    rationale: String(item.rationale || item.reason || "").trim(),
  })).filter(item => item.kw && item.sub);

  if (formatted.length === 0) {
    throw new Error("No valid suggestions found in the AI response.");
  }

  return formatted;
}

export function AIGenerator({ onSearch, onSave, onOpenSettings }: AIGeneratorProps) {
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

    let tier = "cloud";
    let provider = "gemini";
    let customApiKey = "";

    const savedSettings = localStorage.getItem("reddscan_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        tier = parsed.tier || "cloud";
        provider = parsed.provider || "gemini";
        
        if (tier === "byok") {
          customApiKey = provider === "openai" ? parsed.openaiKey : parsed.geminiKey;
        }
      } catch (err) {
        console.error("Failed to parse settings", err);
      }
    }

    try {
      let data: any = null;

      try {
        // Try calling Vercel Serverless Function first
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idea: idea.trim(),
            provider,
            customApiKey: tier === "byok" ? customApiKey : undefined,
          }),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // If server function returns non-OK or non-JSON (like local dev 404 HTML), and we are in BYOK mode
          if (tier === "byok" && customApiKey) {
            console.log("Vercel Serverless proxy unavailable/error. Falling back to direct client-side LLM call...");
            data = await executeClientSideLLM(idea.trim(), provider as any, customApiKey);
          } else {
            // Throw proxy error
            let errText = "";
            try {
              errText = await response.text();
            } catch (_) {}
            throw new Error(errText || `HTTP ${response.status} Error`);
          }
        }
      } catch (fetchErr: any) {
        // If the fetch itself failed (e.g. local 404, network error) or parsing failed, and we have custom key
        if (tier === "byok" && customApiKey) {
          console.log("Fetch failed or error. Falling back to direct client-side LLM call...", fetchErr);
          data = await executeClientSideLLM(idea.trim(), provider as any, customApiKey);
        } else {
          throw fetchErr;
        }
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format received from AI. Please try again.");
      }

      setSuggestions(data);
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
        
        {/* Settings Shortcut Button */}
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
            <button
              onClick={(e) => { e.preventDefault(); onOpenSettings(); }}
              style={{ background: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 12, padding: 0, marginTop: 6, fontWeight: 500, display: "underline" } as any}
            >
              Check or paste your API keys in Settings &rarr;
            </button>
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
