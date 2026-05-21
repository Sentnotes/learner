-- Create trackers table
CREATE TABLE IF NOT EXISTS public.trackers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    kw TEXT NOT NULL,
    sub TEXT NOT NULL,
    sort TEXT NOT NULL,
    time TEXT NOT NULL,
    limit_num NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own trackers
CREATE POLICY "Users can insert their own trackers."
    ON public.trackers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to select their own trackers
CREATE POLICY "Users can view their own trackers."
    ON public.trackers FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to update their own trackers
CREATE POLICY "Users can update their own trackers."
    ON public.trackers FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own trackers
CREATE POLICY "Users can delete their own trackers."
    ON public.trackers FOR DELETE
    USING (auth.uid() = user_id);
