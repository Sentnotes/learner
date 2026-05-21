import React, { useState } from "react";
import { TrendingUp, RefreshCw, AlertCircle, Plus, Search } from "lucide-react";

interface TrendCloudProps {
  onSearch: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  onSave: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
}

interface WordFreq {
  word: string;
  count: number;
}

export function TrendCloud({ onSearch, onSave }: TrendCloudProps) {
  const [subreddit, setSubreddit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trends, setTrends] = useState<WordFreq[]>([]);
  const [status, setStatus] = useState("");

  const stopWords = new Set([
    "the", "and", "a", "of", "to", "is", "in", "it", "that", "this", "for", "on", "with", "as", "at", "by", "an",
    "be", "this", "are", "from", "your", "my", "me", "we", "he", "she", "they", "them", "us", "i", "you", "your",
    "was", "were", "been", "have", "has", "had", "do", "does", "did", "but", "or", "so", "if", "out", "about",
    "how", "what", "why", "who", "when", "where", "which", "will", "would", "should", "could", "can", "cannot",
    "about", "more", "some", "any", "no", "not", "yes", "than", "then", "just", "like", "get", "go", "up", "down",
    "into", "over", "under", "again", "further", "once", "here", "there", "all", "both", "each", "few", "other",
    "some", "such", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should",
    "shouldn", "now", "d", "ll", "m", "o", "re", "ve", "y", "ain", "aren", "aren't", "couldn", "couldn't",
    "didn", "didn't", "doesn", "doesn't", "hadn", "hadn't", "hasn", "hasn't", "haven", "haven't", "isn", "isn't",
    "ma", "mightn", "mightn't", "mustn", "mustn't", "needn", "needn't", "shan", "shan't", "shouldn", "shouldn't",
    "wasn", "wasn't", "weren", "weren't", "won", "won't", "wouldn", "wouldn't", "reddit", "subreddit", "post",
    "thread", "posts", "comment", "comments", "people", "someone", "anyone", "everyone", "something", "anything",
    "nothing", "everything", "really", "much", "many", "good", "bad", "new", "old", "best", "worst", "great",
    "make", "made", "take", "took", "see", "saw", "know", "knew", "think", "thought", "want", "wanted", "look",
    "looking", "going", "gone", "come", "came", "give", "gave", "find", "found", "use", "used", "using", "work",
    "working", "time", "day", "week", "month", "year", "way", "need", "needs", "needed", "back", "first", "last",
    "one", "two", "three", "first", "second", "third", "hi", "hello", "hey", "thanks", "thank", "please",
    "deleted", "removed"
  ]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subreddit.trim()) return;

    setLoading(true);
    setError("");
    setTrends([]);
    setStatus("Connecting to Reddit...");

    const subName = subreddit.replace(/r\//i, "").trim();

    try {
      const fetchUrl = `https://www.reddit.com/r/${subName}/hot.json?limit=75`;

      // Multi-Proxy Resilient Fetch
      const proxies = [
        {
          name: "AllOrigins",
          getUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
        },
        {
          name: "CORS Proxy IO",
          getUrl: (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
        },
        {
          name: "Codetabs",
          getUrl: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        }
      ];

      let jsonResult: any = null;
      let lastError: any = null;

      for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        try {
          setStatus(`Analyzing r/${subName} via ${proxy.name}...`);
          const res = await fetch(proxy.getUrl(fetchUrl));
          if (res.ok) {
            const rawText = await res.text();
            jsonResult = JSON.parse(rawText);
            break;
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (e: any) {
          console.warn(`Trend Cloud Proxy ${proxy.name} failed:`, e);
          lastError = e;
        }
      }

      if (!jsonResult || !jsonResult.data || !jsonResult.data.children) {
        throw new Error(
          lastError?.message || "Failed to fetch subreddit data. Please check the spelling."
        );
      }

      const posts = jsonResult.data.children;
      if (posts.length === 0) {
        throw new Error("No posts found in this subreddit. Make sure it is active.");
      }

      setStatus("Extracting trending keywords...");

      // Text Processing
      const wordCounts: { [key: string]: number } = {};

      posts.forEach((child: any) => {
        const title = child.data.title || "";
        const selftext = child.data.selftext || "";
        const combinedText = `${title} ${selftext}`;

        // Clean text: strip special characters, numbers, convert to lowercase
        const cleanedText = combinedText
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, " ")
          .replace(/\s+/g, " ");

        const tokens = cleanedText.split(" ");

        tokens.forEach((token) => {
          const word = token.trim();
          if (
            word.length > 3 && // Skip short words
            !stopWords.has(word) && // Skip stop words
            !/^\d+$/.test(word) // Skip pure numbers
          ) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });
      });

      // Sort and grab top 20
      const sortedFreqs: WordFreq[] = Object.keys(wordCounts)
        .map((word) => ({ word, count: wordCounts[word] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      if (sortedFreqs.length === 0) {
        throw new Error("Could not extract enough meaningful words to display a trend cloud.");
      }

      setTrends(sortedFreqs);
      setStatus(`Successfully extracted top ${sortedFreqs.length} topics from r/${subName}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to extract trends.");
    } finally {
      setLoading(false);
    }
  };

  const getMaxCount = () => {
    if (trends.length === 0) return 1;
    return Math.max(...trends.map((t) => t.count));
  };

  const getFontSize = (count: number) => {
    const max = getMaxCount();
    const ratio = count / max;
    // Map ratio to 13px - 28px font size range
    return Math.floor(13 + ratio * 15);
  };

  const getOpacity = (count: number) => {
    const max = getMaxCount();
    const ratio = count / max;
    return Math.max(0.6, ratio);
  };

  const getWordColor = (count: number) => {
    const max = getMaxCount();
    const ratio = count / max;
    // If it's a top-tier word, color it orange; otherwise, shades of light primary/accent-purple
    if (ratio > 0.8) return "var(--accent-orange)";
    if (ratio > 0.5) return "var(--accent-purple)";
    return "var(--text-primary)";
  };

  return (
    <div className="search-card" style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <TrendingUp size={20} style={{ color: "var(--accent-orange)" }} />
        <div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Subreddit Trend Cloud
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Fetch the latest top posts from any subreddit and discover the most talked-about topics.
          </p>
        </div>
      </div>

      <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>
            r/
          </span>
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 30 }}
            placeholder="e.g. Entrepreneur, productivity, SaaS"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="search-btn"
          style={{ padding: "0 24px", minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          disabled={loading || !subreddit.trim()}
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" style={{ animation: "pulse 1s linear infinite" }} />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp size={14} />
              Extract Trends
            </>
          )}
        </button>
      </form>

      {/* Error Output */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#f87171",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Processing Status */}
      {loading && status && (
        <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-secondary)", fontSize: 13 }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: "2px solid rgba(255,255,255,0.05)",
              borderTopColor: "var(--accent-orange)",
              borderRadius: "50%",
              margin: "0 auto 8px auto",
              animation: "pulse 1s linear infinite",
            }}
          />
          {status}
        </div>
      )}

      {/* Trend Cloud Rendering */}
      {trends.length > 0 && !loading && (
        <div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-light)",
              borderRadius: 12,
              padding: 24,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px 20px",
              minHeight: 180,
              marginBottom: 16,
            }}
          >
            {trends.map((item, index) => {
              const fontSize = getFontSize(item.count);
              const opacity = getOpacity(item.count);
              const color = getWordColor(item.count);

              return (
                <div
                  key={index}
                  style={{
                    fontSize,
                    opacity,
                    color,
                    fontWeight: fontSize > 20 ? 700 : fontSize > 16 ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    userSelect: "none",
                    position: "relative",
                  }}
                  className="trend-word-chip"
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.15)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.opacity = String(opacity);
                  }}
                >
                  {item.word}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: "normal",
                      color: "var(--text-muted)",
                      marginLeft: 4,
                      verticalAlign: "super",
                    }}
                  >
                    ({item.count})
                  </span>
                  
                  {/* Micro Actions Menu on Hover */}
                  <div
                    className="chip-hover-actions"
                    style={{
                      position: "absolute",
                      bottom: "-24px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-light)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      display: "none",
                      gap: 6,
                      zIndex: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button
                      title="Search this topic"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSearch({
                          kw: item.word,
                          sub: subreddit.replace(/r\//i, "").trim(),
                          sort: "relevance",
                          time: "month",
                          limit: 25,
                        });
                      }}
                      style={{ background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: 2 }}
                    >
                      <Search size={10} />
                    </button>
                    <button
                      title="Track this topic"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSave({
                          kw: item.word,
                          sub: subreddit.replace(/r\//i, "").trim(),
                          sort: "relevance",
                          time: "month",
                          limit: 25,
                        });
                      }}
                      style={{ background: "transparent", border: "none", color: "var(--accent-orange)", cursor: "pointer", padding: 2 }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--accent-orange)", fontWeight: 600 }}>Pro-Tip:</span> Hover over words to instantly run a search or add a tracker!
          </div>

          {/* Inject style for trend chips dynamically to handle action display */}
          <style dangerouslySetInnerHTML={{__html: `
            .trend-word-chip:hover .chip-hover-actions {
              display: flex !important;
            }
          `}} />
        </div>
      )}
    </div>
  );
}
