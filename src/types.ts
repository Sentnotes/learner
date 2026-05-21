export interface RedditPost {
  title: string;
  subreddit: string;
  author: string;
  score: string | number;
  num_comments: string | number;
  created_utc: number | null;
  url: string;
  selftext_preview: string;
}

export interface SavedSearch {
  id: string;
  kw: string;
  sub: string;
  sort: string;
  time: string;
  limit: number | string;
  timestamp: number;
}
