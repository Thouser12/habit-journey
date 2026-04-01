-- ============================================================
-- Migration: Add doctor authentication and shared data tables
-- ============================================================

-- 1. Add role column to profiles (patient vs doctor)
ALTER TABLE public.profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'doctor'));

-- 2. Create doctor_profiles table
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  crm_number TEXT,
  specialty TEXT,
  doctor_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read own profile"
  ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own profile"
  ON public.doctor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can insert own profile"
  ON public.doctor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow patients to look up a doctor by code (for connection flow)
CREATE POLICY "Anyone can look up doctor by code"
  ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Function to generate doctor_code
CREATE OR REPLACE FUNCTION public.generate_doctor_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := 'DR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.doctor_profiles WHERE doctor_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- 4. Update handle_new_user to support doctor role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');

  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), user_role);

  IF user_role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (id, name, crm_number, specialty, doctor_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'crm_number',
      NEW.raw_user_meta_data->>'specialty',
      generate_doctor_code()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Add doctor_user_id to doctor_connections (links to the actual auth user)
ALTER TABLE public.doctor_connections
  ADD COLUMN doctor_user_id UUID REFERENCES auth.users(id);

-- RLS: Doctors can read connections where they are the doctor
CREATE POLICY "Doctors can read their patient connections"
  ON public.doctor_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_user_id);

-- RLS: Doctors can update connection status (accept/reject)
CREATE POLICY "Doctors can update connection status"
  ON public.doctor_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_user_id)
  WITH CHECK (auth.uid() = doctor_user_id);

-- 6. Create goals table (doctor-assigned goals for patients)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID NOT NULL REFERENCES public.doctor_connections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'Daily',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Doctors can manage goals they created
CREATE POLICY "Doctors can read their goals"
  ON public.goals FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert goals"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their goals"
  ON public.goals FOR DELETE
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Patients can read goals assigned to them
CREATE POLICY "Patients can read their assigned goals"
  ON public.goals FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- 7. Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.doctor_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('doctor', 'patient')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Both sides of a connection can read messages
CREATE POLICY "Connection participants can read messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.id = connection_id
      AND (dc.user_id = auth.uid() OR dc.doctor_user_id = auth.uid())
    )
  );

-- Both sides can send messages
CREATE POLICY "Connection participants can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.id = connection_id
      AND (dc.user_id = auth.uid() OR dc.doctor_user_id = auth.uid())
    )
  );

-- 8. Index for common queries
CREATE INDEX idx_doctor_connections_doctor_user_id ON public.doctor_connections(doctor_user_id);
CREATE INDEX idx_doctor_connections_doctor_id ON public.doctor_connections(doctor_id);
CREATE INDEX idx_goals_doctor_id ON public.goals(doctor_id);
CREATE INDEX idx_goals_patient_id ON public.goals(patient_id);
CREATE INDEX idx_goals_connection_id ON public.goals(connection_id);
CREATE INDEX idx_chat_messages_connection_id ON public.chat_messages(connection_id);
CREATE INDEX idx_doctor_profiles_doctor_code ON public.doctor_profiles(doctor_code);
