-- ============================================================
-- Migration: Device tokens for push notifications (FCM v1)
-- Stores APNs/FCM tokens registered by the patient and doctor apps.
-- A single Supabase project serves both apps; the `app` column
-- distinguishes them so the dispatcher can target the right device.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  app TEXT NOT NULL CHECK (app IN ('patient', 'doctor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx
  ON public.device_tokens(user_id);

CREATE INDEX IF NOT EXISTS device_tokens_user_app_idx
  ON public.device_tokens(user_id, app);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own tokens.
CREATE POLICY "Users select own tokens"
  ON public.device_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tokens"
  ON public.device_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tokens"
  ON public.device_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own tokens"
  ON public.device_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep updated_at fresh.
CREATE OR REPLACE FUNCTION public.touch_device_tokens_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER device_tokens_touch_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.touch_device_tokens_updated_at();
