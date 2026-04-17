-- Per-connection read tracking (replaces global last_chat_read_at for per-conversation granularity)
CREATE TABLE public.connection_read_states (
  connection_id UUID NOT NULL REFERENCES public.doctor_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (connection_id, user_id)
);

CREATE INDEX idx_connection_read_states_user ON public.connection_read_states(user_id);

ALTER TABLE public.connection_read_states ENABLE ROW LEVEL SECURITY;

-- Each user can read/write their own read-state rows
CREATE POLICY "Users manage own read states"
  ON public.connection_read_states FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
