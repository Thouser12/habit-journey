-- Allow doctors to read profiles of their connected patients
CREATE POLICY "Doctors can read connected patient profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.doctor_user_id = auth.uid()
        AND dc.user_id = profiles.id
        AND dc.status = 'accepted'
    )
  );
