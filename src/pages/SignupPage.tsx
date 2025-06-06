import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Ícones para o cabeçalho e botão de loading
import { UserPlus, Loader2 } from "lucide-react";

// --- Função de força de senha (sem alterações, já estava ótima) ---
const getPasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return { score: 0, label: "", color: "bg-transparent" };

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 25, label: "Fraca", color: "bg-red-500" };
  if (score <= 3) return { score: 50, label: "Média", color: "bg-yellow-500" };
  if (score <= 4) return { score: 75, label: "Forte", color: "bg-blue-500" };
  return { score: 100, label: "Muito Forte", color: "bg-green-500" };
};

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

// Mapa de cores para o texto da força da senha (código mais limpo)
const strengthTextColors: { [key: number]: string } = {
  25: "text-red-500",
  50: "text-yellow-500",
  75: "text-blue-500",
  100: "text-green-500",
};

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "",
    color: "bg-transparent",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordStrength.score < 50) {
      // Opcional: Adicionar um toast/alerta informando que a senha é fraca
      console.warn("Tentativa de cadastro com senha fraca.");
      // Poderia retornar aqui para forçar uma senha mais forte
    }
    setIsLoading(true);
    try {
      const user = await signup(email, password, displayName);
      if (user) {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Falha no cadastro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(getPasswordStrength(newPassword));
  };

  return (
    // 1. Layout principal com gradiente, idêntico ao de login
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-sky-950 p-4 selection:bg-primary/20">
      {/* 2. Card com animação, sombra e padding aprimorados */}
      <Card className="w-full max-w-md bg-card shadow-xl rounded-lg overflow-hidden animate-fade-in-up">
        {/* 3. Cabeçalho estilizado com ícone */}
        <CardHeader className="text-center p-6 sm:p-8 bg-muted/20 dark:bg-muted/30">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus size={32} strokeWidth={1.5} />
          </div>
          <CardTitle className="text-3xl font-semibold text-foreground">
            Crie sua Conta
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            É rápido e fácil. Comece agora!
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          {/* 4. Conteúdo com espaçamento consistente */}
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Como devemos te chamar?"
                autoFocus
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                className="h-10"
              />
              {/* Medidor de força da senha integrado ao novo design */}
              {password && (
                <div className="pt-2">
                  <Progress
                    value={passwordStrength.score}
                    className="h-2 [&>div]:transition-all [&>div]:duration-300" // Adiciona transição suave
                    indicatorClassName={passwordStrength.color} // Propriedade para cor do indicador
                  />
                  <p
                    className={`text-xs mt-1.5 text-right font-medium ${
                      strengthTextColors[passwordStrength.score] ||
                      "text-transparent"
                    }`}
                  >
                    Força: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          {/* 5. Rodapé com botão e link estilizados */}
          <CardFooter className="flex flex-col gap-4 p-6 sm:p-8">
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading || passwordStrength.score < 50}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Faça Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
