import { Rss, Trash2, Bookmark, Sparkles } from "lucide-react";
import type { SavedSearch } from "../types";

interface SidebarProps {
  savedSearches: SavedSearch[];
  onSelectSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
  activeSearchId?: string;
  bookmarkCount: number;
}

export function Sidebar({
  savedSearches,
  onSelectSearch,
  onDeleteSearch,
  activeSearchId,
  bookmarkCount,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Rss className="logo-icon" size={28} />
        <span className="logo-text">ReddScan</span>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">
          <Bookmark size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
          Saved Trackers
        </h3>
        {savedSearches.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 4px" }}>
            No keywords saved. Click "Save Keyword Tracker" above.
          </div>
        ) : (
          <div className="saved-searches-list">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className={`saved-search-item ${activeSearchId === search.id ? "active" : ""}`}
                style={{
                  borderColor: activeSearchId === search.id ? "var(--accent-orange)" : "",
                  background: activeSearchId === search.id ? "rgba(255, 69, 0, 0.05)" : "",
                }}
                onClick={() => onSelectSearch(search)}
              >
                <div className="saved-search-info">
                  <div>
                    <div style={{ fontWeight: 600 }}>{search.kw}</div>
                    <div className="saved-search-sub">
                      {search.sub ? `r/${search.sub}` : "all subreddits"} • {search.sort} • {search.time === "all" ? "all time" : search.time}
                    </div>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSearch(search.id);
                  }}
                  title="Remove Tracker"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-section" style={{ marginTop: 20 }}>
        <h3 className="sidebar-title">
          <Sparkles size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
          My Bookmarks
        </h3>
        <div className="saved-search-item" style={{ cursor: "default" }}>
          <div className="saved-search-info">
            <span style={{ fontWeight: 600 }}>Bookmarked Posts</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-purple)", background: "rgba(139, 92, 246, 0.1)", padding: "2px 8px", borderRadius: 12 }}>
            {bookmarkCount}
          </span>
        </div>
      </div>

      <div className="system-status">
        <div className="status-dot"></div>
        <div className="status-text">
          <strong>CORS Proxy Active</strong>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>ReddScan v1.0.0</div>
        </div>
      </div>
    </aside>
  );
}
