-- =============================================
-- Bookmarks table - saves Reddit posts users bookmark
-- =============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    subreddit TEXT,
    author TEXT,
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    created_utc NUMERIC,
    selftext TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own bookmarks."
    ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks."
    ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks."
    ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Prevent duplicate bookmarks per user
CREATE UNIQUE INDEX idx_bookmarks_user_url ON public.bookmarks (user_id, url);


-- =============================================
-- AI Chats table - saves AI generation history
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    provider TEXT DEFAULT 'gemini',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own ai chats."
    ON public.ai_chats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ai chats."
    ON public.ai_chats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai chats."
    ON public.ai_chats FOR DELETE USING (auth.uid() = user_id);
