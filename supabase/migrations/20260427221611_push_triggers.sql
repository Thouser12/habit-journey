-- ============================================================
-- Migration: Push notification triggers
-- Triggers: chat_messages INSERT, doctor_connections INSERT (pending)
-- Both call the `send-push` edge function via pg_net.
--
-- Required Vault secrets (configured once per environment via SQL Editor):
--   send_push_url      -> https://<project>.supabase.co/functions/v1/send-push
--   service_role_key   -> the project service-role API key
-- See bottom of file for setup snippet.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----- helper -----
CREATE OR REPLACE FUNCTION public.dispatch_push(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_url TEXT;
  v_token TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'send_push_url';
  SELECT decrypted_secret INTO v_token
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_url IS NULL OR v_token IS NULL THEN
    -- Vault not configured yet. Fail silently so the originating insert still succeeds.
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_token,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'userId', p_user_id::text,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );
END;
$$;

-- ----- chat messages -----
CREATE OR REPLACE FUNCTION public.on_chat_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient UUID;
  v_sender_name TEXT;
BEGIN
  IF NEW.sender_type = 'patient' THEN
    SELECT doctor_user_id INTO v_recipient
      FROM doctor_connections WHERE id = NEW.connection_id;
    SELECT name INTO v_sender_name
      FROM profiles WHERE id = NEW.sender_id;
  ELSIF NEW.sender_type = 'doctor' THEN
    SELECT user_id INTO v_recipient
      FROM doctor_connections WHERE id = NEW.connection_id;
    SELECT name INTO v_sender_name
      FROM doctor_profiles WHERE id = NEW.sender_id;
  END IF;

  IF v_recipient IS NOT NULL THEN
    PERFORM public.dispatch_push(
      v_recipient,
      COALESCE(NULLIF(v_sender_name, ''), 'Nova mensagem'),
      LEFT(NEW.text, 100),
      jsonb_build_object(
        'type', 'message',
        'connectionId', NEW.connection_id::text
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_message_push ON public.chat_messages;
CREATE TRIGGER chat_message_push
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.on_chat_message_insert();

-- ----- connection requests -----
CREATE OR REPLACE FUNCTION public.on_connection_request_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_name TEXT;
BEGIN
  IF NEW.status = 'pending' AND NEW.doctor_user_id IS NOT NULL THEN
    SELECT name INTO v_patient_name
      FROM profiles WHERE id = NEW.user_id;
    PERFORM public.dispatch_push(
      NEW.doctor_user_id,
      'Novo pedido de paciente',
      COALESCE(NULLIF(v_patient_name, ''), 'Um paciente') || ' quer se conectar',
      jsonb_build_object(
        'type', 'request',
        'connectionId', NEW.id::text
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connection_request_push ON public.doctor_connections;
CREATE TRIGGER connection_request_push
  AFTER INSERT ON public.doctor_connections
  FOR EACH ROW EXECUTE FUNCTION public.on_connection_request_insert();

-- ============================================================
-- ONE-TIME SETUP (run manually in SQL Editor of each environment):
--
-- DEV:
--   SELECT vault.create_secret(
--     'https://nghcnduftfsbosdretfk.supabase.co/functions/v1/send-push',
--     'send_push_url',
--     'URL of the send-push edge function'
--   );
--   SELECT vault.create_secret(
--     '<DEV_SERVICE_ROLE_KEY>',
--     'service_role_key',
--     'Service role key used by push triggers'
--   );
--
-- PROD:
--   SELECT vault.create_secret(
--     'https://cvegqdvpogmntygdjjvi.supabase.co/functions/v1/send-push',
--     'send_push_url',
--     'URL of the send-push edge function'
--   );
--   SELECT vault.create_secret(
--     '<PROD_SERVICE_ROLE_KEY>',
--     'service_role_key',
--     'Service role key used by push triggers'
--   );
-- ============================================================
