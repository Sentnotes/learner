import React, { useState } from "react";
import { Search, Plus, Sliders, Globe, Layers, Clock } from "lucide-react";

interface SearchControlProps {
  onSearch: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  onSave: (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => void;
  loading: boolean;
  initialValues?: { kw: string; sub: string; sort: string; time: string; limit: number | string };
}

export function SearchControl({ onSearch, onSave, loading, initialValues }: SearchControlProps) {
  const [kw, setKw] = useState(initialValues?.kw || "");
  const [sub, setSub] = useState(initialValues?.sub || "");
  const [sort, setSort] = useState(initialValues?.sort || "relevance");
  const [time, setTime] = useState(initialValues?.time || "all");
  const [limit, setLimit] = useState(initialValues?.limit || "25");

  // Sync state if initialValues changes (e.g. from selecting a saved search)
  React.useEffect(() => {
    if (initialValues) {
      setKw(initialValues.kw);
      setSub(initialValues.sub);
      setSort(initialValues.sort);
      setTime(initialValues.time || "all");
      setLimit(initialValues.limit);
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kw.trim() && !sub.trim()) return;
    onSearch({ kw, sub, sort, time, limit });
  };

  const handleSave = () => {
    if (!kw.trim() && !sub.trim()) return;
    onSave({ kw, sub, sort, time, limit });
  };

  return (
    <div className="search-card">
      <form onSubmit={handleSubmit} className="search-form-grid">
        <div className="input-group">
          <label className="input-label" htmlFor="kw-search">
            <Search size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
            Keyword to Search <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span>
          </label>
          <input
            id="kw-search"
            type="text"
            className="input-field"
            placeholder="e.g. chatgpt, webdev (or blank for entire sub)"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="sub-search">
            <Globe size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
            Subreddit <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional if keyword is set)</span>
          </label>
          <input
            id="sub-search"
            type="text"
            className="input-field"
            placeholder="e.g. AskReddit, technology"
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="sort-search">
            <Layers size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
            Sort By
          </label>
          <select
            id="sort-search"
            className="input-field select-field"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            disabled={loading}
          >
            <option value="relevance">Relevance</option>
            <option value="hot">Hot</option>
            <option value="new">New</option>
            <option value="top">Top</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="time-search">
            <Clock size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
            Time Frame
          </label>
          <select
            id="time-search"
            className="input-field select-field"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={loading}
          >
            <option value="all">All Time</option>
            <option value="year">Past Year</option>
            <option value="month">Past Month</option>
            <option value="week">Past Week</option>
            <option value="day">Past 24 Hours</option>
            <option value="hour">Past Hour</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="limit-search">
            <Sliders size={14} style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }} />
            Post Limit
          </label>
          <select
            id="limit-search"
            className="input-field select-field"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            disabled={loading}
          >
            <option value="10">10 results</option>
            <option value="25">25 results</option>
            <option value="50">50 results</option>
            <option value="100">100 results</option>
          </select>
        </div>
      </form>

      <div className="form-actions">
        <button
          type="button"
          className="save-search-btn"
          onClick={handleSave}
          disabled={(!kw.trim() && !sub.trim()) || loading}
        >
          <Plus size={14} />
          Save Keyword Tracker
        </button>

        <button
          type="submit"
          className="search-btn"
          onClick={handleSubmit}
          disabled={(!kw.trim() && !sub.trim()) || loading}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "pulse 1s linear infinite",
                }}
              />
              Searching...
            </>
          ) : (
            <>
              <Search size={16} />
              Run Keyword Search
            </>
          )}
        </button>
      </div>
    </div>
  );
}
