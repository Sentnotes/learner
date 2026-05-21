import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { SearchControl } from "./components/SearchControl";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { PostFeed } from "./components/PostFeed";
import { useRedditSearch } from "./hooks/useRedditSearch";
import type { SavedSearch, RedditPost } from "./types";
import { Sparkles, RefreshCw, LogOut } from "lucide-react";
import { StarterPacks } from "./components/StarterPacks";
import { TrendCloud } from "./components/TrendCloud";
import { SettingsModal } from "./components/SettingsModal";
import { AIGenerator } from "./components/AIGenerator";
import { AuthPage } from "./components/AuthPage";
import { supabase } from "./lib/supabaseClient";

function Dashboard({ session }: { session: any }) {
  const navigate = useNavigate();
  const {
    loading,
    error,
    posts,
    status,
    doSearch,
  } = useRedditSearch();

  // State management
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [bookmarks, setBookmarks] = useState<RedditPost[]>([]);
  const [activeSearch, setActiveSearch] = useState<SavedSearch | undefined>(undefined);
  const [currentKeyword, setCurrentKeyword] = useState<string>("");
  const [searchParams, setSearchParams] = useState<{ kw: string; sub: string; sort: string; time: string; limit: number | string } | undefined>(undefined);
  
  // Settings & subscription billing state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<{ tier: "cloud" | "byok"; provider: "gemini" | "openai"; geminiKey: string; openaiKey: string }>({
    tier: "cloud",
    provider: "gemini",
    geminiKey: "",
    openaiKey: "",
  });

  // Load from Supabase & local storage on mount
  useEffect(() => {
    async function loadTrackers() {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from('trackers')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setSavedSearches(data.map(d => ({
          id: d.id,
          kw: d.kw,
          sub: d.sub,
          sort: d.sort,
          time: d.time,
          limit: d.limit_num,
          timestamp: new Date(d.created_at).getTime()
        })));
      }
    }
    loadTrackers();

    async function loadBookmarks() {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setBookmarks(data.map(d => ({
          title: d.title,
          url: d.url,
          subreddit: d.subreddit,
          author: d.author,
          score: d.score,
          num_comments: d.num_comments,
          created_utc: Number(d.created_utc || 0),
          selftext_preview: d.selftext || ""
        })));
      }
    }
    loadBookmarks();

    const savedSettings = localStorage.getItem("reddscan_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed loading settings", e);
      }
    }
  }, [session]);



  const handleSearch = (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => {
    setCurrentKeyword(params.kw);
    setSearchParams(params);
    const matched = savedSearches.find(
      (s) =>
        s.kw.toLowerCase() === params.kw.toLowerCase() &&
        s.sub.toLowerCase() === params.sub.toLowerCase() &&
        s.sort === params.sort &&
        s.time === params.time
    );
    setActiveSearch(matched);
    doSearch(params);
  };

  const handleSaveSearch = async (params: { kw: string; sub: string; sort: string; time: string; limit: number | string }) => {
    const duplicate = savedSearches.find(
      (s) =>
        s.kw.toLowerCase() === params.kw.toLowerCase() &&
        s.sub.toLowerCase() === params.sub.toLowerCase() &&
        s.sort === params.sort &&
        s.time === params.time
    );

    if (duplicate) return;

    const { data, error } = await supabase.from('trackers').insert([{
      user_id: session.user.id,
      kw: params.kw,
      sub: params.sub,
      sort: params.sort,
      time: params.time,
      limit_num: typeof params.limit === 'string' ? parseInt(params.limit) : params.limit
    }]).select();

    if (data && !error) {
      const newSearch: SavedSearch = {
        id: data[0].id,
        kw: data[0].kw,
        sub: data[0].sub,
        sort: data[0].sort,
        time: data[0].time,
        limit: data[0].limit_num,
        timestamp: new Date(data[0].created_at).getTime()
      };
      setSavedSearches([newSearch, ...savedSearches]);
      setActiveSearch(newSearch);
    } else {
      console.error("Failed to save tracker:", error);
    }
  };

  const handleSaveBulkSearches = async (presets: { kw: string; sub: string; sort: string; time: string; limit: number | string }[]) => {
    const toInsert = presets.filter(p => !savedSearches.some(
      s => s.kw.toLowerCase() === p.kw.toLowerCase() && s.sub.toLowerCase() === p.sub.toLowerCase() && s.sort === p.sort && s.time === p.time
    )).map(p => ({
      user_id: session.user.id,
      kw: p.kw,
      sub: p.sub,
      sort: p.sort,
      time: p.time,
      limit_num: typeof p.limit === 'string' ? parseInt(p.limit) : p.limit
    }));

    if (toInsert.length === 0) return;

    const { data, error } = await supabase.from('trackers').insert(toInsert).select();
    
    if (data && !error) {
      const newSearches: SavedSearch[] = data.map(d => ({
        id: d.id,
        kw: d.kw,
        sub: d.sub,
        sort: d.sort,
        time: d.time,
        limit: d.limit_num,
        timestamp: new Date(d.created_at).getTime()
      }));
      setSavedSearches([...newSearches, ...savedSearches]);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    const { error } = await supabase.from('trackers').delete().eq('id', id);
    if (!error) {
      setSavedSearches(savedSearches.filter((s) => s.id !== id));
      if (activeSearch?.id === id) {
        setActiveSearch(undefined);
      }
    }
  };

  const handleSelectSearch = (search: SavedSearch) => {
    setActiveSearch(search);
    setCurrentKeyword(search.kw);
    const params = {
      kw: search.kw,
      sub: search.sub,
      sort: search.sort,
      time: search.time || "all",
      limit: search.limit,
    };
    setSearchParams(params);
    doSearch(params);
  };

  const handleToggleBookmark = async (post: RedditPost) => {
    const isBookmarked = bookmarks.some((b) => b.url === post.url);

    if (isBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', session.user.id)
        .eq('url', post.url);

      if (!error) {
        setBookmarks(bookmarks.filter((b) => b.url !== post.url));
      } else {
        console.error("Failed to delete bookmark:", error);
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert([{
          user_id: session.user.id,
          title: post.title,
          url: post.url,
          subreddit: post.subreddit,
          author: post.author,
          score: post.score || 0,
          num_comments: post.num_comments || 0,
          created_utc: post.created_utc || 0,
          selftext: post.selftext_preview || ""
        }]);

      if (!error) {
        setBookmarks([post, ...bookmarks]);
      } else {
        console.error("Failed to insert bookmark:", error);
      }
    }
  };

  const handleSubredditClick = (subreddit: string) => {
    const searchParams = {
      kw: currentKeyword || "development",
      sub: subreddit,
      sort: "relevance",
      time: "all",
      limit: 25,
    };
    handleSearch(searchParams);
  };

  const handlePresetSearch = (presetKeyword: string) => {
    const searchParams = {
      kw: presetKeyword,
      sub: "",
      sort: "relevance",
      time: "all",
      limit: 25,
    };
    handleSearch(searchParams);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <Sidebar
        savedSearches={savedSearches}
        onSelectSearch={handleSelectSearch}
        onDeleteSearch={handleDeleteSearch}
        activeSearchId={activeSearch?.id}
        bookmarkCount={bookmarks.length}
      />

      <main className="main-content">
        <header className="dashboard-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="dashboard-title">Reddit Keyword Tracker</h1>
              <p className="dashboard-subtitle">
                Track, monitor, and analyze custom keywords across Reddit in real-time.
              </p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Hiding settings button since we are running on the free server-side tier
              <button
                className="save-search-btn"
                style={{ background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border-light)" }}
                onClick={() => setIsSettingsOpen(true)}
              >
                <SettingsIcon size={14} style={{ color: "var(--accent-purple)" }} />
                AI Settings
              </button>
              */}
              <button
                className="save-search-btn"
                style={{ background: "transparent", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Sign Out
              </button>
              {posts.length > 0 && !loading && (
                <button
                  className="save-search-btn"
                  style={{ background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() =>
                    handleSearch({
                      kw: currentKeyword,
                      sub: activeSearch?.sub || "",
                      sort: activeSearch?.sort || "relevance",
                      time: activeSearch?.time || "all",
                      limit: activeSearch?.limit || 25,
                    })
                  }
                >
                  <RefreshCw size={13} />
                  Refresh Feed
                </button>
              )}
            </div>
          </div>
        </header>

        <SearchControl
          onSearch={handleSearch}
          onSave={handleSaveSearch}
          loading={loading}
          initialValues={searchParams}
        />

        {posts.length === 0 && !loading && (
          <div style={{ marginBottom: 32 }}>
            <h4 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} style={{ color: "var(--accent-orange)" }} />
              Try Popular Presets
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["ReactJS", "OpenAI", "indiehackers", "gaming", "Web Development", "Self Improvement"].map((term) => (
                <button
                  key={term}
                  onClick={() => handlePresetSearch(term)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-secondary)",
                    borderRadius: "20px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-orange)";
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.background = "rgba(255, 69, 0, 0.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {posts.length === 0 && !loading && (
          <>
            <AIGenerator onSearch={handleSearch} onSave={handleSaveSearch} session={session} />
            <StarterPacks onAddTrackers={handleSaveBulkSearches} />
            <TrendCloud onSearch={handleSearch} onSave={handleSaveSearch} />
          </>
        )}

        <AnalyticsPanel posts={posts} loading={loading} />

        <PostFeed
          posts={posts}
          loading={loading}
          error={error}
          status={status}
          keyword={currentKeyword}
          bookmarks={bookmarks.map((b) => b.url)}
          onToggleBookmark={handleToggleBookmark}
          onSubredditClick={handleSubredditClick}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updatedSettings) => setSettings(updatedSettings)}
        initialSettings={settings}
      />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-purple)', animation: 'pulse 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!session ? <AuthPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/" 
        element={session ? <Dashboard session={session} /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}
