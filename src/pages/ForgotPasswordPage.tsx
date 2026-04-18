import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm border-border/50 shadow-lg shadow-black/20">
          <CardContent className="pt-6 text-center space-y-4">
            <MailCheck className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Verifique seu email</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de redefinição de senha para <strong className="text-foreground">{email}</strong>. Abra o email e clique no link.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center mb-10">
        <img src={logo} alt="Uberlingen" className="w-24 h-24 object-contain mb-5" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Uberlingen</h1>
        <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[280px]">
          Recuperar senha
        </p>
      </div>

      <Card className="w-full max-w-sm border-border/50 shadow-lg shadow-black/20">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Digite seu email e enviaremos um link para você redefinir sua senha.
            </p>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 text-xs font-medium uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <Button
              type="submit"
              disabled={!isValidEmail || loading}
              className="w-full h-12 rounded-xl disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar link'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <button
        onClick={() => navigate('/login')}
        className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Login
      </button>
    </div>
  );
};

export default ForgotPasswordPage;
