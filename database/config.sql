-- Create app_config table for global application settings
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed with default max_concurrent_sessions
INSERT INTO public.app_config (key, value) 
VALUES ('max_concurrent_sessions', '2'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read config
CREATE POLICY "Allow authenticated read access" ON public.app_config
    FOR SELECT USING (auth.role() = 'authenticated');
