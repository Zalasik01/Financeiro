import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; // Importar Progress
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Função para avaliar a força da senha
const getPasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return { score: 0, label: "", color: "bg-transparent" };

  if (password.length >= 8) score++;
  if (password.length >= 12) score++; // Bônus por comprimento maior
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // Caracteres especiais

  // Ajustar o score para uma escala de 0-4 para o Progress (0-100)
  // e definir rótulos e cores
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
    setIsLoading(true);
    try {
      const user = await signup(email, password, displayName);
      if (user) {
        navigate("/"); // Redireciona para a página inicial após cadastro
      }
    } catch (error) {
      // O toast de erro já é tratado dentro do hook useAuth
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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta para começar a gerenciar suas finanças.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Seu Nome"
                autoFocus
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Informe seu email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Informe sua senha"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
              />
              {password && (
                <div className="mt-2">
                  <Progress
                    value={passwordStrength.score}
                    className={`h-2 ${passwordStrength.color}`}
                  />
                  <p
                    className={`text-xs mt-1 ${
                      passwordStrength.score === 25
                        ? "text-red-500"
                        : passwordStrength.score === 50
                        ? "text-yellow-600"
                        : passwordStrength.score === 75
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  >
                    Força: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link to="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
