-- ============================================================
-- Migration: Add daily_records and weekly_summaries tables
-- Enables patient progress data to be stored in Supabase
-- so the doctor-view can read real patient data
-- ============================================================

-- 1. Create daily_records table (replaces localStorage dailyRecords)
CREATE TABLE public.daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  level TEXT NOT NULL DEFAULT 'bronze',
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, record_date)
);

CREATE INDEX idx_daily_records_user_date ON public.daily_records(user_id, record_date DESC);

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

-- Patients can read/write their own records
CREATE POLICY "Users can read own daily records"
  ON public.daily_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily records"
  ON public.daily_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily records"
  ON public.daily_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Doctors can read records of their connected patients
CREATE POLICY "Doctors can read connected patient daily records"
  ON public.daily_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.doctor_user_id = auth.uid()
        AND dc.user_id = daily_records.user_id
        AND dc.status = 'accepted'
    )
  );

-- 2. Create weekly_summaries table (replaces localStorage weeklyHistory)
CREATE TABLE public.weekly_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  percentage INT NOT NULL DEFAULT 0,
  level_before TEXT NOT NULL,
  level_after TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('promoted', 'maintained', 'demoted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_summaries_user ON public.weekly_summaries(user_id, week_start DESC);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Patients can read/insert their own summaries
CREATE POLICY "Users can read own weekly summaries"
  ON public.weekly_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries"
  ON public.weekly_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Doctors can read connected patients' summaries
CREATE POLICY "Doctors can read connected patient summaries"
  ON public.weekly_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.doctor_user_id = auth.uid()
        AND dc.user_id = weekly_summaries.user_id
        AND dc.status = 'accepted'
    )
  );

-- 3. Add week_start_date to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS week_start_date DATE DEFAULT CURRENT_DATE;
