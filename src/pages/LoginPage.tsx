import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isValidEmail && password.length > 0;

  const emailError = touched.email && email.length > 0 && !isValidEmail;
  const passwordError = touched.password && password.length === 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError("");
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error);
    } else {
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <img src={logo} alt="Uberlingen" className="w-24 h-24 object-contain mb-5" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Uberlingen
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[260px]">
          Evolua com disciplina, um dia de cada vez.
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-sm border-border/50 shadow-lg shadow-black/20">
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email */}
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
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className={`h-12 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 transition-shadow focus-visible:ring-primary/40 focus-visible:border-primary/50 ${
                  emailError ? "border-destructive/60 focus-visible:ring-destructive/30" : ""
                }`}
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1">Digite um email valido.</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80 text-xs font-medium uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  className={`h-12 pr-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 transition-shadow focus-visible:ring-primary/40 focus-visible:border-primary/50 ${
                    passwordError ? "border-destructive/60 focus-visible:ring-destructive/30" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive mt-1">Senha obrigatoria.</p>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm tracking-wide rounded-xl transition-all disabled:opacity-40"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sign Up */}
      <div className="mt-8 flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Novo aqui?</span>
        <button
          onClick={() => navigate("/signup")}
          className="text-primary font-medium hover:underline underline-offset-2 transition-colors"
        >
          Criar Conta
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
