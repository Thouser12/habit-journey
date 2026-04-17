import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

const UNREAD_UPDATED_EVENT = 'patient-unread-updated';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchCount = useCallback(async () => {
    if (!user) return;

    // Get the accepted connection
    const { data: conn } = await supabase
      .from('doctor_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();

    if (!conn) {
      setCount(0);
      return;
    }

    // Get last_chat_read_at from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_chat_read_at')
      .eq('id', user.id)
      .single();

    const lastRead = profile?.last_chat_read_at ?? '1970-01-01T00:00:00Z';

    // Count messages sent by doctor after lastRead
    const { count: msgCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', conn.id)
      .eq('sender_type', 'doctor')
      .gt('created_at', lastRead);

    setCount(msgCount ?? 0);
  }, [user]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Listen for local markAsRead events so other instances (BottomNav, Chat, etc.)
  // update immediately without a page refresh.
  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener(UNREAD_UPDATED_EVENT, handler);
    return () => window.removeEventListener(UNREAD_UPDATED_EVENT, handler);
  }, [fetchCount]);

  // Realtime: refresh when new message arrives
  useEffect(() => {
    if (!user) return;
    if (channelRef.current) return; // already subscribed

    const channelName = `unread-messages-${crypto.randomUUID()}`;
    const channel = supabase.channel(channelName);
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      () => {
        fetchCount();
      }
    );
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchCount]);

  const markAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ last_chat_read_at: new Date().toISOString() })
      .eq('id', user.id);
    setCount(0);
    window.dispatchEvent(new CustomEvent(UNREAD_UPDATED_EVENT));
  }, [user]);

  return { count, markAsRead, refetch: fetchCount };
}
