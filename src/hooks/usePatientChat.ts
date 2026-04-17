import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  text: string;
  timestamp: string;
}

export function usePatientChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [doctorAvatar, setDoctorAvatar] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchChat = useCallback(async () => {
    if (!user) return;

    // Get accepted doctor connection
    const { data: conn } = await supabase
      .from('doctor_connections')
      .select('id, doctor_name, doctor_user_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();

    if (!conn) {
      setConnectionId(null);
      setDoctorName(null);
      setDoctorAvatar(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setConnectionId(conn.id);
    setDoctorName(conn.doctor_name);

    // Fetch doctor avatar
    if (conn.doctor_user_id) {
      const { data: doctor } = await supabase
        .from('doctor_profiles')
        .select('avatar_url')
        .eq('id', conn.doctor_user_id)
        .maybeSingle();
      setDoctorAvatar(doctor?.avatar_url ?? null);
    }

    // Fetch messages
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('connection_id', conn.id)
      .order('created_at', { ascending: true });

    setMessages(
      (msgs ?? []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        senderType: m.sender_type as 'doctor' | 'patient',
        text: m.text,
        timestamp: m.created_at,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !connectionId) return;
    if (channelRef.current) return;

    const channel = supabase.channel(`patient-chat-${crypto.randomUUID()}`);
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `connection_id=eq.${connectionId}`,
      },
      (payload) => {
        const msg = payload.new as {
          id: string;
          connection_id: string;
          sender_id: string;
          sender_type: string;
          text: string;
          created_at: string;
        };

        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              senderId: msg.sender_id,
              senderType: msg.sender_type as 'doctor' | 'patient',
              text: msg.text,
              timestamp: msg.created_at,
            },
          ];
        });
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
  }, [user, connectionId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !connectionId) return;

    await supabase.from('chat_messages').insert({
      connection_id: connectionId,
      sender_id: user.id,
      sender_type: 'patient',
      text,
    });
  }, [user, connectionId]);

  return { messages, loading, sendMessage, doctorName, doctorAvatar, connected: !!connectionId };
}
