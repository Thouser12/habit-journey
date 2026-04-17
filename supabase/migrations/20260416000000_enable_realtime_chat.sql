-- Enable realtime on chat_messages so INSERT events are broadcast to subscribers
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Ensure full row data is sent (required for postgres_changes to work correctly)
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
