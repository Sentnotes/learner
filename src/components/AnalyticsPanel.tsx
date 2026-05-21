import { BarChart3, PieChart, Users } from "lucide-react";
import type { RedditPost } from "../types";

interface AnalyticsPanelProps {
  posts: RedditPost[];
  loading: boolean;
}

export function AnalyticsPanel({ posts, loading }: AnalyticsPanelProps) {
  if (loading || posts.length === 0) return null;

  // 1. Calculate unique subreddits and their frequencies
  const subredditCounts: Record<string, number> = {};
  posts.forEach((post) => {
    if (post.subreddit) {
      subredditCounts[post.subreddit] = (subredditCounts[post.subreddit] || 0) + 1;
    }
  });

  // Sort subreddits by post count descending
  const sortedSubreddits = Object.entries(subredditCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Take top 5

  const totalSubredditTaggedPosts = posts.filter((p) => p.subreddit).length;

  // 2. Calculate unique authors
  const uniqueAuthors = new Set(posts.map((p) => p.author)).size;

  // 3. Find most active author
  const authorCounts: Record<string, number> = {};
  posts.forEach((post) => {
    authorCounts[post.author] = (authorCounts[post.author] || 0) + 1;
  });
  const topAuthor = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  return (
    <div className="analytics-section">
      {/* Subreddit Distribution */}
      <div className="analytics-card">
        <h4 className="analytics-card-title">
          <BarChart3 size={16} className="logo-icon" style={{ color: "var(--accent-purple)" }} />
          Subreddit Distribution (Top 5)
        </h4>

        {sortedSubreddits.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            No subreddit metrics available.
          </div>
        ) : (
          <div className="subreddit-bar-list">
            {sortedSubreddits.map(([sub, count]) => {
              const percentage = totalSubredditTaggedPosts > 0
                ? Math.round((count / totalSubredditTaggedPosts) * 100)
                : 0;

              return (
                <div key={sub} className="subreddit-bar-item">
                  <div className="subreddit-bar-info">
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>r/{sub}</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {count} post{count !== 1 ? "s" : ""} ({percentage}%)
                    </span>
                  </div>
                  <div className="subreddit-bar-bg">
                    <div
                      className="subreddit-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="analytics-card">
        <h4 className="analytics-card-title">
          <PieChart size={16} className="logo-icon" style={{ color: "var(--accent-orange)" }} />
          Search Overview & Metrics
        </h4>

        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-value">{posts.length}</div>
            <div className="metric-label">Total Posts</div>
          </div>

          <div className="metric-box">
            <div className="metric-value" style={{ color: "var(--accent-purple)" }}>
              {Object.keys(subredditCounts).length}
            </div>
            <div className="metric-label">Subreddits</div>
          </div>

          <div className="metric-box">
            <div className="metric-value" style={{ color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Users size={18} />
              {uniqueAuthors}
            </div>
            <div className="metric-label">Unique Authors</div>
          </div>

          <div className="metric-box">
            <div className="metric-value" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "6px 0" }} title={topAuthor}>
              {topAuthor}
            </div>
            <div className="metric-label">Most Active User</div>
          </div>
        </div>
      </div>
    </div>
  );
}
