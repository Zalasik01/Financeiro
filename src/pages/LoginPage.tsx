import { AccessSelectionModal } from "@/components/AccessSelectionModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
import { userEmail } from "@/utils/storage";
import { AlertCircle, Building, Eye, EyeOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const [modalAlreadyOpened, setModalAlreadyOpened] = useState(false);
  const modalProcessingRef = useRef(false);

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

  // Carregar email salvo do localStorage
  useEffect(() => {
    const savedEmail = userEmail.get();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

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

  // Efeito separado para verificar se deve abrir o modal após login bem-sucedido
  useEffect(() => {
    console.log("🔍 [LoginPage] useEffect Modal - Estados:", {
      currentUser: !!currentUser,
      currentUserEmail: currentUser?.email,
      authLoading,
      basesLoading,
      status,
      isModalOpen,
      modalAlreadyOpened,
      modalProcessing: modalProcessingRef.current,
      basesParaUsuarioCount: basesParaUsuario.length,
      timestamp: new Date().toISOString(),
    });

    if (
      currentUser &&
      !authLoading &&
      !basesLoading &&
      status === "LOADING" &&
      !isModalOpen &&
      !modalAlreadyOpened &&
      !modalProcessingRef.current
    ) {
      console.log("✅ [LoginPage] Condições atendidas para abrir modal");

      // Marcar como processando para evitar execuções duplas
      modalProcessingRef.current = true;

      if (currentUser.isAdmin || basesParaUsuario.length > 0) {
        console.log("🚀 [LoginPage] Abrindo modal:", {
          isAdmin: currentUser.isAdmin,
          basesCount: basesParaUsuario.length,
        });

        // Garantir que só execute uma vez por login
        setModalAlreadyOpened(true);
        setIsModalOpen(true);
        setStatus("IDLE");
      } else {
        console.log("❌ [LoginPage] Usuário sem bases associadas");
        setError("Você não possui nenhuma base de dados associada.");
        setStatus("ERROR");
        logout();
      }
    } else {
      console.log("⏸️ [LoginPage] Condições NÃO atendidas:", {
        hasCurrentUser: !!currentUser,
        authNotLoading: !authLoading,
        basesNotLoading: !basesLoading,
        statusIsLoading: status === "LOADING",
        modalNotOpen: !isModalOpen,
        modalNotAlreadyOpened: !modalAlreadyOpened,
        modalNotProcessing: !modalProcessingRef.current,
      });
    }
  }, [
    currentUser,
    authLoading,
    basesLoading,
    status,
    isModalOpen,
    modalAlreadyOpened,
    basesParaUsuario.length, // Usar apenas o length para evitar re-criações do array
    logout,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "LOADING") return;

    console.log("🚀 [LoginPage] handleSubmit iniciado:", {
      email,
      status,
      isModalOpen,
      modalAlreadyOpened,
      timestamp: new Date().toISOString(),
    });

    setError(null);
    setStatus("LOADING");
    setModalAlreadyOpened(false); // Reset do flag
    modalProcessingRef.current = false; // Reset do flag de processamento

    console.log("⚙️ [LoginPage] Estados atualizados no handleSubmit:", {
      newStatus: "LOADING",
      modalAlreadyOpened: false,
      modalProcessing: false,
    });

    try {
      console.log("🔐 [LoginPage] Chamando login...");
      await login(email, password);
      console.log("✅ [LoginPage] Login concluído com sucesso");
      // O useEffect acima cuidará do resto quando currentUser for atualizado
    } catch (error) {
      console.error("❌ [LoginPage] Falha no login:", error);
      setError("E-mail ou senha inválidos. Verifique suas credenciais.");
      setStatus("ERROR");
    }
  };

  const handleBaseSelected = useCallback(
    (baseId: string) => {
      console.log("🎯 [LoginPage] Base selecionada:", baseId);
      setSelectedBaseId(baseId);
      setIsModalOpen(false); // Fecha o modal
      // A navegação será acionada pelo primeiro useEffect.
    },
    [setSelectedBaseId]
  );

  const handleModalClose = useCallback(() => {
    console.log("❌ [LoginPage] Modal fechado pelo usuário");
    setIsModalOpen(false);
    setModalAlreadyOpened(false); // Reset do flag quando modal é fechado
    modalProcessingRef.current = false; // Reset do flag de processamento
    logout();
    setStatus("IDLE");
  }, [logout]);

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
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/esqueceu-senha"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
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
