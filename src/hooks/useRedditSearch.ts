import { useState, useCallback } from "react";
import type { RedditPost } from "../types";

interface UseRedditSearchParams {
  kw?: string;
  sub?: string;
  sort?: string;
  time?: string;
  limit?: number | string;
}

export function useRedditSearch() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [status, setStatus] = useState<string>("");

  const doSearch = useCallback(async ({ kw = "", sub = "", sort = "relevance", time = "all", limit = 25 }: UseRedditSearchParams) => {
    if (!kw.trim() && !sub.trim()) return;

    setLoading(true);
    setError("");
    setPosts([]);
    setStatus("Searching Reddit...");

    try {
      let searchUrl = "";
      if (kw.trim()) {
        const query = encodeURIComponent(kw.trim());
        const baseUrl = sub.trim()
          ? `https://www.reddit.com/r/${sub.trim()}/search.json`
          : `https://www.reddit.com/search.json`;
        searchUrl = `${baseUrl}?q=${query}&sort=${sort}&t=${time}&restrict_sr=${sub.trim() ? 1 : 0}&limit=${limit}`;
      } else {
        const sortFeed = (sort === "relevance" || !sort) ? "hot" : sort;
        searchUrl = `https://www.reddit.com/r/${sub.trim()}/${sortFeed}.json?limit=${limit}`;
        if (sortFeed === "top" && time) {
          searchUrl += `&t=${time}`;
        }
      }

      // Resilient Multi-Proxy Fallback System
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

      let response: Response | null = null;
      let text = "";
      let lastError: any = null;

      for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        try {
          setStatus(`Searching via ${proxy.name}...`);
          const proxyUrl = proxy.getUrl(searchUrl);
          const res = await fetch(proxyUrl);
          
          if (res.ok) {
            response = res;
            text = await res.text();
            break;
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (e: any) {
          console.warn(`Proxy ${proxy.name} failed:`, e);
          lastError = e;
        }
      }

      if (!response) {
        throw new Error(`All CORS proxies failed to connect (${lastError?.message || "Connection refused"}). This is commonly caused by ad-blockers blocking public CORS proxies.`);
      }

      let jsonResult;
      try {
        jsonResult = JSON.parse(text);
      } catch (err) {
        throw new Error("Failed to parse Reddit JSON response. The format might be invalid.");
      }

      if (!jsonResult || !jsonResult.data || !jsonResult.data.children) {
        throw new Error("Failed to parse Reddit JSON response. The format might be invalid.");
      }

      const items: RedditPost[] = jsonResult.data.children.map((child: any) => {
        const data = child.data;
        const title = data.title || "";
        const link = `https://www.reddit.com${data.permalink}`;
        const author = data.author || "unknown";
        const score = data.score !== undefined ? data.score : "—";
        const num_comments = data.num_comments !== undefined ? data.num_comments : "—";
        const created_utc = data.created_utc || null;
        const subreddit = data.subreddit || "";

        // Clean up selftext html tags and slice
        const rawText = data.selftext ? data.selftext.replace(/<[^>]+>/g, "") : "";
        const selftext_preview = rawText.length > 220 ? rawText.slice(0, 220) + "..." : rawText;

        return {
          title,
          subreddit,
          author,
          score,
          num_comments,
          created_utc,
          url: data.url || link,
          selftext_preview,
        };
      });

      setPosts(items);
      setStatus(`${items.length} result${items.length !== 1 ? "s" : ""} found`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Search failed");
      setStatus("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    posts,
    status,
    doSearch,
    setPosts,
    setStatus,
  };
}
