-- ============================================================
-- Migration: Profile enhancements (avatars, notifications tracking)
-- ============================================================

-- 1. Storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own profile picture
CREATE POLICY "Users can update own profile picture"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own profile picture
CREATE POLICY "Users can delete own profile picture"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read of profile pictures
CREATE POLICY "Anyone can read profile pictures"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'profile-pictures');

-- 2. Add avatar_url and notification tracking to profiles (patients)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS achievements_seen TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_chat_read_at TIMESTAMPTZ;

-- 3. Add avatar_url and last_chat_read_at to doctor_profiles
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS last_chat_read_at TIMESTAMPTZ;
