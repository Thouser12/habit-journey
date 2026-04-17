-- Allow doctors to update daily records for their connected patients
CREATE POLICY "Doctors can update connected patient daily records"
  ON public.daily_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.doctor_user_id = auth.uid()
        AND dc.user_id = daily_records.user_id
        AND dc.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_connections dc
      WHERE dc.doctor_user_id = auth.uid()
        AND dc.user_id = daily_records.user_id
        AND dc.status = 'accepted'
    )
  );
