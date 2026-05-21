import React, { useState, useEffect } from "react";
import { X, Key, Shield, Save, Check } from "lucide-react";

interface Settings {
  tier: "cloud" | "byok";
  provider: "gemini" | "openai";
  geminiKey: string;
  openaiKey: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  initialSettings?: Settings;
}

export function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
  const [tier, setTier] = useState<"cloud" | "byok">("cloud");
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [saved, setSaved] = useState(false);

  // Sync settings when opened
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem("reddscan_settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setTier(parsed.tier || "cloud");
          setProvider(parsed.provider || "gemini");
          setGeminiKey(parsed.geminiKey || "");
          setOpenaiKey(parsed.openaiKey || "");
        } catch (e) {
          console.error("Failed loading settings from local storage", e);
        }
      } else if (initialSettings) {
        setTier(initialSettings.tier);
        setProvider(initialSettings.provider);
        setGeminiKey(initialSettings.geminiKey);
        setOpenaiKey(initialSettings.openaiKey);
      }
      setSaved(false);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: Settings = {
      tier,
      provider,
      geminiKey: tier === "byok" ? geminiKey.trim() : "",
      openaiKey: tier === "byok" ? openaiKey.trim() : "",
    };
    localStorage.setItem("reddscan_settings", JSON.stringify(settings));
    onSave(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(6, 7, 10, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-light)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 500,
          padding: 28,
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.8)",
          position: "relative",
          animation: "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Key size={18} style={{ color: "var(--accent-orange)" }} />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              ReddScan AI Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Tier Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 10 }}>
              AI Plan / Billing Tier
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Cloud Tier */}
              <div
                onClick={() => setTier("cloud")}
                style={{
                  background: tier === "cloud" ? "rgba(255, 69, 0, 0.04)" : "rgba(255,255,255,0.01)",
                  border: `1px solid ${tier === "cloud" ? "var(--accent-orange)" : "var(--border-light)"}`,
                  borderRadius: 10,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: tier === "cloud" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    ReddScan AI Cloud
                  </span>
                  <span style={{ fontSize: 11, background: "var(--accent-orange)", color: "#fff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                    $10/mo
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
                  Out of the box access. Zero API configuration. Uses our secure API gateway.
                </p>
              </div>

              {/* BYOK Tier */}
              <div
                onClick={() => setTier("byok")}
                style={{
                  background: tier === "byok" ? "rgba(139, 92, 246, 0.04)" : "rgba(255,255,255,0.01)",
                  border: `1px solid ${tier === "byok" ? "var(--accent-purple)" : "var(--border-light)"}`,
                  borderRadius: 10,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: tier === "byok" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    Bring Your Own Key
                  </span>
                  <span style={{ fontSize: 11, background: "var(--accent-purple)", color: "#fff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                    $5/mo
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
                  Discounted software subscription. Enter your own API key to power AI ideas.
                </p>
              </div>
            </div>
          </div>

          {/* BYOK Key Panel */}
          {tier === "byok" && (
            <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-light)", borderRadius: 10, padding: 18, marginBottom: 24, animation: "fadeIn 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Shield size={13} style={{ color: "var(--accent-purple)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Local Storage Secure Key Storage
                </span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  API Provider
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: provider === "gemini" ? "rgba(255,255,255,0.06)" : "transparent",
                      border: `1px solid ${provider === "gemini" ? "var(--accent-purple)" : "var(--border-light)"}`,
                      color: provider === "gemini" ? "var(--text-primary)" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("openai")}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: provider === "openai" ? "rgba(255,255,255,0.06)" : "transparent",
                      border: `1px solid ${provider === "openai" ? "var(--accent-purple)" : "var(--border-light)"}`,
                      color: provider === "openai" ? "var(--text-primary)" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    OpenAI
                  </button>
                </div>
              </div>

              {provider === "gemini" ? (
                <div>
                  <label htmlFor="gemini-key" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Gemini API Key (API_KEY)
                  </label>
                  <input
                    id="gemini-key"
                    type="password"
                    className="input-field"
                    style={{ fontSize: 13 }}
                    placeholder="Enter Google Gemini API Key..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    required
                  />

                </div>
              ) : (
                <div>
                  <label htmlFor="openai-key" style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    OpenAI API Key (sk-...)
                  </label>
                  <input
                    id="openai-key"
                    type="password"
                    className="input-field"
                    style={{ fontSize: 13 }}
                    placeholder="Enter OpenAI API Key..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    required
                  />

                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="save-search-btn"
              onClick={onClose}
              style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="search-btn"
              style={{
                minWidth: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: saved ? "#10b981" : "var(--accent-orange)",
              }}
            >
              {saved ? (
                <>
                  <Check size={14} /> Settings Saved
                </>
              ) : (
                <>
                  <Save size={14} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Dynamic Keyframes inject */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
