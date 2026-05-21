import { useState, useMemo } from "react";
import { MessageSquare, ThumbsUp, Calendar, ExternalLink, ShieldAlert, Inbox, Bookmark } from "lucide-react";
import type { RedditPost } from "../types";

interface PostFeedProps {
  posts: RedditPost[];
  loading: boolean;
  error: string;
  status: string;
  keyword: string;
  bookmarks: string[];
  onToggleBookmark: (post: RedditPost) => void;
  onSubredditClick: (subreddit: string) => void;
}

export function PostFeed({
  posts,
  loading,
  error,
  status,
  keyword,
  bookmarks,
  onToggleBookmark,
  onSubredditClick,
}: PostFeedProps) {

  const [localSort, setLocalSort] = useState<"default" | "upvotes" | "comments">("default");

  const sortedPosts = useMemo(() => {
    if (localSort === "default") return posts;
    return [...posts].sort((a, b) => {
      const getNum = (val: any) => typeof val === "number" ? val : 0;
      if (localSort === "upvotes") {
        return getNum(b.score) - getNum(a.score);
      } else {
        return getNum(b.num_comments) - getNum(a.num_comments);
      }
    });
  }, [posts, localSort]);

  // React-safe Text Highlighter
  const renderHighlightedText = (text: string, term: string) => {
    if (!term || !term.trim()) return text;
    
    // Escape regex characters
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="highlight-term">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Human Readable Relative Time
  const formatRelativeTime = (timestamp: number | null) => {
    if (!timestamp) return "unknown time";
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Format full UTC date string
  const formatFullDate = (timestamp: number | null) => {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Rendering States
  if (error) {
    return (
      <div className="empty-state" style={{ borderColor: "#f87171" }}>
        <ShieldAlert size={48} className="empty-icon" style={{ color: "#ef4444" }} />
        <h4 className="empty-title" style={{ color: "#ef4444" }}>Search Failed</h4>
        <p className="empty-desc">{error}</p>
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
          Ensure that your keyword is valid, or try searching for another term.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="feed-status">
          <span className="status-badge">
            <div
              style={{
                width: 10,
                height: 10,
                border: "2px solid rgba(255, 69, 0, 0.3)",
                borderTopColor: "var(--accent-orange)",
                borderRadius: "50%",
                animation: "pulse 0.8s linear infinite",
                display: "inline-block",
              }}
            />
            {status}
          </span>
        </div>
        <div className="posts-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="shimmer-card" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <Inbox size={48} className="empty-icon" />
        <h4 className="empty-title">Feed is empty</h4>
        <p className="empty-desc">
          Enter a keyword or click one of your saved keyword trackers to query Reddit RSS feeds.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="feed-status" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="status-badge">{status}</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Showing up to {posts.length} posts
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sort display by:</label>
          <select 
            className="input-field select-field" 
            style={{ padding: "6px 32px 6px 12px", fontSize: 13, height: "auto" }}
            value={localSort}
            onChange={(e) => setLocalSort(e.target.value as any)}
          >
            <option value="default">Default</option>
            <option value="upvotes">Upvotes (High to Low)</option>
            <option value="comments">Comments (High to Low)</option>
          </select>
        </div>
      </div>

      <div className="posts-grid">
        {sortedPosts.map((post, index) => {
          const isBookmarked = bookmarks.includes(post.url);
          return (
            <article key={index} className="post-card">
              <header className="post-header">
                <div className="post-meta-left">
                  {post.subreddit && (
                    <button
                      className="subreddit-tag"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubredditClick(post.subreddit);
                      }}
                      title={`Search only r/${post.subreddit}`}
                      style={{ border: "none", cursor: "pointer" }}
                    >
                      r/{post.subreddit}
                    </button>
                  )}
                  <span className="post-author">Posted by u/{post.author}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="post-time" title={formatFullDate(post.created_utc)}>
                    <Calendar size={12} style={{ marginRight: 4, display: "inline-block", verticalAlign: "middle" }} />
                    {formatRelativeTime(post.created_utc)}
                  </span>
                  <button
                    className={`post-bookmark-btn ${isBookmarked ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(post);
                    }}
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark Post"}
                  >
                    <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                  </button>
                </div>
              </header>

              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="post-title"
              >
                {renderHighlightedText(post.title, keyword)}
              </a>

              {post.selftext_preview && (
                <p className="post-preview">
                  {renderHighlightedText(post.selftext_preview, keyword)}
                  {post.selftext_preview.length >= 220 && "..."}
                </p>
              )}

              <footer className="post-footer">
                <div className="post-stat">
                  <ThumbsUp size={14} />
                  <span>{post.score} votes</span>
                </div>
                <div className="post-stat">
                  <MessageSquare size={14} />
                  <span>{post.num_comments} comments</span>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="post-stat"
                  style={{ color: "var(--accent-purple)", marginLeft: "auto", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                >
                  View on Reddit
                  <ExternalLink size={12} />
                </a>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
