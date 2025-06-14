import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
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
} from "lucide-react";
import { AccessSelectionModal } from "@/components/AccessSelectionModal";

type LoginStatus = "IDLE" | "LOADING" | "ERROR";

const AppLogo = () => (
  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
    <Building size={36} strokeWidth={1.5} />
  </div>
);

const FullScreenLoader = () => (
  <div
    className="flex items-center justify-center min-h-screen w-full bg-cover bg-center"
    style={{ backgroundImage: "url('/app_finance.png')" }}
  >
    <div className="absolute inset-0 bg-black/50 z-0" />
    <div className="z-10">
      <Loader2 className="h-12 w-12 animate-spin text-white" />
    </div>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("IDLE");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    login,
    logout,
    currentUser,
    loading: authLoading,
    selectedBaseId,
    setSelectedBaseId,
  } = useAuth();
  const { bases: allBases, loading: basesLoading } = useStores();
  const navigate = useNavigate();

  const dataIsLoading = authLoading || basesLoading;

  const basesParaUsuario = useMemo(() => {
    if (!currentUser || !allBases) return [];
    if (currentUser.isAdmin) return allBases;
    return allBases.filter(
      (base) =>
        base.ativo &&
        ((base.authorizedUIDs && base.authorizedUIDs[currentUser.uid]) ||
          base.createdBy === currentUser.uid)
    );
  }, [allBases, currentUser]);

  useEffect(() => {
    if (currentUser && selectedBaseId) {
      navigate("/", { replace: true });
    }
  }, [currentUser, selectedBaseId, navigate]);

  useEffect(() => {
    // Este efeito só se preocupa em abrir o modal quando o carregamento termina.
    if (status === "LOADING" && !dataIsLoading) {
      if (currentUser) {
        if (currentUser.isAdmin || basesParaUsuario.length > 0) {
          setIsModalOpen(true);
        } else {
          setError("Você não possui nenhuma base de dados associada.");
          setStatus("ERROR");
          logout();
        }
      }
      // Reseta o status para IDLE, pois a tarefa de carregar terminou.
      setStatus("IDLE");
    }
  }, [status, dataIsLoading, currentUser, basesParaUsuario, logout]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "LOADING") return;

    setError(null);
    setStatus("LOADING"); // Apenas indica que estamos em um processo de carregamento.
    
    try {
      await login(email, password);
      // O useEffect acima cuidará do resto quando o loading terminar.
    } catch (error) {
      console.error("Falha no login:", error);
      setError("E-mail ou senha inválidos. Verifique suas credenciais.");
      setStatus("ERROR");
    }
  };
  
  const handleBaseSelected = (baseId: string) => {
    setSelectedBaseId(baseId);
    setIsModalOpen(false); // Fecha o modal
    // A navegação será acionada pelo primeiro useEffect.
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    logout();
    setStatus("IDLE");
  };
  
  const isLoading = status === "LOADING";

  // Se o hook de auth ainda estiver carregando, mostre o loader de tela cheia.
  // Isso só acontece no primeiro carregamento da página.
  if (authLoading && !currentUser) {
    return <FullScreenLoader />;
  }

  return (
    <div
      className="relative flex items-center justify-center min-h-screen p-4 w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/app_finance.png')" }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />

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
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} placeholder="Digite sua senha" autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="h-11 pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3 text-muted-foreground hover:text-primary" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            {status === "ERROR" && error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha</AlertTitle>
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
      
      {/* O Modal agora é renderizado aqui, controlado por seu próprio estado `isOpen` */}
      <AccessSelectionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSelectBase={handleBaseSelected}
          bases={basesParaUsuario}
          isAdmin={!!currentUser?.isAdmin}
      />
    </div>
  );
}