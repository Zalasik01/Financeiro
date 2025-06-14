import { useState, useEffect, useMemo } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  LogIn,
} from "lucide-react";
import { AccessSelectionModal } from "@/components/AccessSelectionModal";
import { useStores } from "@/hooks/useStores";

const AppLogo = () => (
  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
    <Building size={36} strokeWidth={1.5} />
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    login,
    logout,
    currentUser,
    loading: authLoading,
    selectedBaseId,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { bases: allBases, loading: basesLoading } = useStores();
  const [showBaseModal, setShowBaseModal] = useState(false);

  // ... (useMemo e useEffects permanecem os mesmos)
  const basesParaUsuario = useMemo(() => {
    if (!currentUser || !allBases) return [];
    return allBases.filter(
      (base) =>
        base.ativo &&
        (currentUser.isAdmin ||
          (base.authorizedUIDs && base.authorizedUIDs[currentUser.uid]) ||
          base.createdBy === currentUser.uid)
    );
  }, [allBases, currentUser]);

  useEffect(() => {
    if (authLoading || basesLoading) return;
    if (currentUser && selectedBaseId) {
      const state = location.state as { from?: Location };
      const from = state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } else if (currentUser && !selectedBaseId) {
      if (basesParaUsuario.length > 0) setShowBaseModal(true);
    }
  }, [currentUser, selectedBaseId, authLoading, basesLoading, basesParaUsuario, navigate, location]);

  useEffect(() => {
    if (email || password) setError(null);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Por favor, preencha e-mail e senha.");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error("Falha no login:", error);
      setError("E-mail ou senha inválidos. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  const FullScreenLoader = ({ withBackground = false }) => (
    <div 
        className="flex items-center justify-center min-h-screen w-full bg-cover bg-center"
        style={withBackground ? { backgroundImage: "url('/app_finance.png')" } : {}}
    >
        {withBackground && <div className="absolute inset-0 bg-black/50 z-0" />}
        <div className="z-10">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
    </div>
  );

  // Lógica de renderização
  if ((authLoading || basesLoading) && !showBaseModal) {
    return <FullScreenLoader withBackground={true} />;
  }

  if (currentUser && !selectedBaseId && basesParaUsuario.length > 0) {
    return (
      <>
        <FullScreenLoader withBackground={true} />
        <AccessSelectionModal
          isOpen={true}
          onClose={() => { logout(); setShowBaseModal(false); }}
          bases={basesParaUsuario}
          isAdmin={!!currentUser?.isAdmin}
        />
      </>
    );
  }

  if (currentUser && !selectedBaseId && basesParaUsuario.length === 0 && !basesLoading && !authLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen p-4 bg-cover bg-center"
        style={{ backgroundImage: "url('/app_finance.png')" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <Card className="w-full max-w-md text-center animate-fade-in z-10">
          <CardHeader>
            <CardTitle className="text-2xl">Nenhuma Base de Dados Encontrada</CardTitle>
            <CardDescription className="pt-2">
              Você está autenticado, mas não tem acesso a nenhuma base de dados. Por favor, entre em contato com o administrador do sistema.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              <LogIn className="mr-2 h-4 w-4" /> Sair da Conta
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  // TELA DE LOGIN PRINCIPAL
  return (
    <div
      className="relative flex items-center justify-center min-h-screen p-4 w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/app_finance.png')" }}
    >
      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-black/50 z-0" />
      
      {/* O z-10 garante que o card fique na frente do overlay */}
      <Card className="z-10 w-full max-w-md bg-card shadow-2xl rounded-lg animate-fade-in">
        <CardHeader className="text-center p-8">
          <AppLogo />
          <CardTitle className="text-3xl font-semibold text-foreground">
            Bem-vindo!
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            Faça login para continuar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-8 pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="h-11" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/esqueceu-senha" className="text-xs font-medium text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} placeholder="••••••••••" autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="h-11 pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3 text-muted-foreground hover:text-primary" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha na Autenticação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="p-8 pt-4">
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>) : ("Entrar")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}