import React, { useState } from "react";
import { Briefcase, Cpu, Zap, ShoppingCart, Plus, Check } from "lucide-react";

interface TrackerPreset {
  kw: string;
  sub: string;
  sort: string;
  time: string;
  limit: number | string;
}

interface StarterPack {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  presets: TrackerPreset[];
}

interface StarterPacksProps {
  onAddTrackers: (presets: TrackerPreset[]) => void;
}

export function StarterPacks({ onAddTrackers }: StarterPacksProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [addedPacks, setAddedPacks] = useState<string[]>([]);

  const packs: StarterPack[] = [
    {
      id: "saas",
      name: "SaaS & Indie Hackers",
      description: "Find pain points, feature requests, and SaaS competitors.",
      icon: <Briefcase size={18} />,
      color: "var(--accent-orange)",
      presets: [
        { kw: "competitor alternative", sub: "SaaS", sort: "relevance", time: "month", limit: 25 },
        { kw: "terrible customer service", sub: "indiehackers", sort: "relevance", time: "month", limit: 25 },
        { kw: "is there a tool for", sub: "Entrepreneur", sort: "relevance", time: "month", limit: 25 },
      ],
    },
    {
      id: "ai",
      name: "AI & Automation",
      description: "Monitor AI tool complaints, developer needs, and ideas.",
      icon: <Cpu size={18} />,
      color: "#a78bfa", // Purple accent
      presets: [
        { kw: "wish there was an AI", sub: "ChatGPT", sort: "relevance", time: "week", limit: 25 },
        { kw: "slow and expensive", sub: "ArtificialInteligence", sort: "relevance", time: "month", limit: 25 },
        { kw: "automate workflow", sub: "singularity", sort: "relevance", time: "month", limit: 25 },
      ],
    },
    {
      id: "productivity",
      name: "Productivity & Habits",
      description: "Track self-improvement goals, habits, and daily friction.",
      icon: <Zap size={18} />,
      color: "#f59e0b", // Amber accent
      presets: [
        { kw: "habit tracker app", sub: "productivity", sort: "relevance", time: "year", limit: 25 },
        { kw: "stop procrastinating", sub: "getdisciplined", sort: "relevance", time: "month", limit: 25 },
        { kw: "best tool to organize", sub: "LifeProTips", sort: "relevance", time: "month", limit: 25 },
      ],
    },
    {
      id: "ecommerce",
      name: "E-commerce & Brands",
      description: "Discover e-com frustrations, marketing issues, and dropship trends.",
      icon: <ShoppingCart size={18} />,
      color: "#10b981", // Emerald accent
      presets: [
        { kw: "conversion rate drop", sub: "ecommerce", sort: "relevance", time: "month", limit: 25 },
        { kw: "supplier issues", sub: "shopify", sort: "relevance", time: "month", limit: 25 },
        { kw: "product listing suspended", sub: "FulfillmentByAmazon", sort: "relevance", time: "month", limit: 25 },
      ],
    },
  ];

  const handleImport = (pack: StarterPack) => {
    onAddTrackers(pack.presets);
    setAddedPacks([...addedPacks, pack.id]);
    setTimeout(() => {
      // Clear standard added state visualization after 3s
      setAddedPacks((prev) => prev.filter((id) => id !== pack.id));
    }, 3000);
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Industry Starter Packs
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Quick-start your dashboard with curated keyword presets for different fields.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {packs.map((pack) => {
          const isAdded = addedPacks.includes(pack.id);
          const isSelected = selectedPack === pack.id;

          return (
            <div
              key={pack.id}
              onClick={() => setSelectedPack(isSelected ? null : pack.id)}
              style={{
                background: "var(--bg-glass)",
                border: `1px solid ${isSelected ? pack.color : "var(--border-light)"}`,
                borderRadius: 12,
                padding: 18,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isSelected ? "translateY(-2px)" : "none",
                boxShadow: isSelected ? `0 8px 24px -10px ${pack.color}40` : "none",
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.background = "var(--bg-glass-hover)";
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.background = "var(--bg-glass)";
                }
              }}
            >
              {/* Header Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: `${pack.color}20`,
                    color: pack.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pack.icon}
                </div>
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                  {pack.name}
                </h4>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 12 }}>
                {pack.description}
              </p>

              {/* Expansion Preview */}
              {isSelected && (
                <div style={{ marginTop: 14, borderTop: "1px solid var(--border-light)", paddingTop: 14, animation: "fadeIn 0.2s" }}>
                  <p style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 8, fontWeight: 600 }}>
                    Trackers Included:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    {pack.presets.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12,
                          background: "rgba(255,255,255,0.02)",
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>"{p.kw}"</span>
                        <span style={{ color: "var(--accent-orange)", fontSize: 11, background: "rgba(255, 69, 0, 0.08)", padding: "2px 6px", borderRadius: 4 }}>
                          r/{p.sub}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImport(pack);
                    }}
                    disabled={isAdded}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: isAdded ? "rgba(16, 185, 129, 0.15)" : pack.color,
                      border: isAdded ? "1px solid rgba(16, 185, 129, 0.3)" : "none",
                      color: isAdded ? "#10b981" : "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.2s",
                    }}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} /> Presets Loaded
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Bulk Add Preset Trackers
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Toggle details indicator */}
              {!isSelected && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                    Click to Preview presets &rarr;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
