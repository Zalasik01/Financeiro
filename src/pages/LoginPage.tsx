import { useState } from "react";
import { useNavigate, Link, useLocation, Location } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return; // Validação simples para evitar requisições vazias

    setIsLoading(true);
    try {
      const user = await login(email, password);
      // A lógica de navegação só será executada se o login for bem-sucedido
      // e não lançar um erro, que seria pego pelo bloco catch.
      if (user) {
        const state = location.state as { from?: Location };
        const from = state?.from?.pathname || "/dashboard"; // Sugestão: redirecionar para /dashboard como padrão
        navigate(from, { replace: true });
      }
    } catch (error) {
      // O toast de erro já é tratado dentro do hook useAuth, o que é uma ótima prática.
      // O console.error é útil para o desenvolvimento.
      console.error("Falha no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-sky-950 p-4 selection:bg-primary/20">
      <Card className="w-full max-w-md bg-card shadow-xl rounded-lg overflow-hidden animate-fade-in-up">
        <CardHeader className="text-center p-6 sm:p-8 bg-muted/20 dark:bg-muted/30">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn size={32} strokeWidth={1.5} />
          </div>
          <CardTitle className="text-3xl font-semibold text-foreground">
            Bem-vindo!
          </CardTitle>
          {/* SUGESTÃO: Adicionado texto descritivo */}
          <CardDescription className="text-muted-foreground pt-1">
            Faça login para acessar suas finanças.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Link
                  to="/esqueceu-senha"
                  className="text-xs text-primary hover:underline"
                  tabIndex={-1} // tabIndex -1 é opcional, remove o link da navegação por Tab
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 sm:p-8">
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <div className="text-center text-sm">
              Não tem uma conta?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Crie uma agora
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
