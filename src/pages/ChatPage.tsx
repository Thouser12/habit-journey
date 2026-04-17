import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';
import { usePatientChat } from '@/hooks/usePatientChat';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const ChatPage = () => {
  const navigate = useNavigate();
  const { messages, loading, sendMessage, doctorName, doctorAvatar, connected } = usePatientChat();
  const { markAsRead } = useUnreadMessages();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read whenever new messages arrive
  useEffect(() => {
    if (!loading && connected) {
      markAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, connected, messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Chat</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Nenhum medico vinculado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vincule-se a um medico para iniciar uma conversa.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/medico')}>
                Vincular Medico
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={doctorAvatar ?? undefined} alt={doctorName ?? 'Medico'} />
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
            {doctorName?.charAt(0) ?? 'D'}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-foreground">Dr. {doctorName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-36 pt-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Diga ola!
          </p>
        )}
        {messages.map(msg => {
          const isPatient = msg.senderType === 'patient';
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isPatient ? 'justify-end' : 'justify-start'}`}>
              {!isPatient && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={doctorAvatar ?? undefined} alt={doctorName ?? 'Medico'} />
                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                    {doctorName?.charAt(0) ?? 'D'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isPatient
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-card text-foreground'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`mt-1 text-[10px] ${
                  isPatient ? 'text-primary-foreground/60' : 'text-muted-foreground'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <input
            type="text"
            placeholder="Digite uma mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 rounded-full bg-secondary py-2.5 pl-4 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
