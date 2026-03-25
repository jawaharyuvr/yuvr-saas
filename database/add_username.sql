-- Add username to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
