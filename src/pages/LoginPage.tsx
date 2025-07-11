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

import { Base } from "@/types/store";

type ExtendedBase = Base & {
  ativo?: boolean;
  authorizedUIDs?: { [uid: string]: { displayName: string; email: string } };
  createdBy?: string;
};

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
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Criar refs para funções estáveis
  const handleBaseSelectedRef = useRef<(baseId: string) => void>();
  const handleModalCloseRef = useRef<() => void>();

  const {
    login,
    logout,
    currentUser,
    loading: authLoading,
    selectedBaseId,
    setSelectedBaseId,
  } = useAuth();
  const { bases: allBases } = useStores();
  const navigate = useNavigate();

  // Carregar email salvo do localStorage
  useEffect(() => {
    const savedEmail = userEmail.get();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const dataIsLoading = authLoading;

  const basesParaUsuario = useMemo(() => {
    if (!currentUser || !allBases) {
      console.log("🔍 [LoginPage] basesParaUsuario: retornando array vazio", {
        hasCurrentUser: !!currentUser,
        hasAllBases: !!allBases,
        allBasesLength: allBases?.length || 0,
      });
      return [];
    }

    if (currentUser.isAdmin) {
      console.log("🔍 [LoginPage] basesParaUsuario: admin vê todas as bases", {
        isAdmin: currentUser.isAdmin,
        totalBases: allBases.length,
        bases: allBases.map((b) => ({ id: b.id, name: b.name })),
      });
      // Admin vê todas as bases (ativas e inativas)
      return allBases;
    }

    // Para usuários não-admin, filtrar apenas bases ativas que eles têm acesso
    const filteredBases = allBases.filter((base: ExtendedBase) => base.ativo);
    console.log("🔍 [LoginPage] basesParaUsuario: usuário normal", {
      isAdmin: currentUser.isAdmin,
      totalBases: allBases.length,
      filteredBases: filteredBases.length,
    });
    return filteredBases;
  }, [allBases, currentUser]);

  useEffect(() => {
    if (currentUser && selectedBaseId) {
      navigate("/", { replace: true });
    }
  }, [currentUser, selectedBaseId, navigate]);

  // Limpeza quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
        modalTimeoutRef.current = null;
      }
      modalProcessingRef.current = false;
    };
  }, []);

  // Implementar funções estáveis usando refs
  handleBaseSelectedRef.current = (baseId: string) => {
    console.log("🎯 [LoginPage] Base selecionada:", baseId);
    setSelectedBaseId(baseId);
    setIsModalOpen(false); // Fecha o modal
    // A navegação será acionada pelo primeiro useEffect.
  };

  handleModalCloseRef.current = () => {
    console.log("❌ [LoginPage] Modal fechado pelo usuário");

    // Limpar timeout se existir
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }

    setIsModalOpen(false);
    setModalAlreadyOpened(false); // Reset do flag quando modal é fechado
    modalProcessingRef.current = false; // Reset do flag de processamento
    logout();
    setStatus("IDLE");
  };

  // Criar funções wrapper estáveis
  const stableHandleBaseSelected = useCallback((baseId: string) => {
    handleBaseSelectedRef.current?.(baseId);
  }, []);

  const stableHandleModalClose = useCallback(() => {
    handleModalCloseRef.current?.();
  }, []);

  // Efeito separado para verificar se deve abrir o modal após login bem-sucedido
  useEffect(() => {
    console.log("🔍 [LoginPage] useEffect modal - verificando condições:", {
      hasCurrentUser: !!currentUser,
      isAdmin: currentUser?.isAdmin,
      authLoading,
      hasAllBases: !!allBases,
      allBasesLength: allBases?.length || 0,
      status,
      isModalOpen,
      modalAlreadyOpened,
      modalProcessingRefCurrent: modalProcessingRef.current,
      basesParaUsuarioLength: basesParaUsuario.length,
    });

    // Só processar se o usuário acabou de fazer login (não em carregamentos subsequentes)
    // IMPORTANTE: Para admin, aguardar pelo menos uma tentativa de carregamento das bases
    const shouldWaitForBases = currentUser?.isAdmin;
    const basesLoaded = shouldWaitForBases
      ? allBases && allBases.length >= 0
      : true;

    console.log("🔍 [LoginPage] Análise de carregamento:", {
      shouldWaitForBases,
      basesLoaded,
      allBasesLength: allBases?.length,
      basesParaUsuarioLength: basesParaUsuario.length,
    });

    if (
      currentUser &&
      !authLoading &&
      allBases && // Garantir que as bases foram carregadas
      basesLoaded && // Para admin, garantir que as bases foram processadas
      status === "LOADING" &&
      !isModalOpen &&
      !modalAlreadyOpened &&
      !modalProcessingRef.current &&
      (currentUser.isAdmin || basesParaUsuario.length > 0) // Só prosseguir se tiver bases ou for admin
    ) {
      console.log(
        "🎯 [LoginPage] Condições atendidas - preparando para abrir modal"
      );

      // Limpar timeout anterior se existir
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }

      // Usar setTimeout para garantir que o estado seja estável
      modalTimeoutRef.current = setTimeout(() => {
        console.log(
          "⏰ [LoginPage] Timeout executado - verificando condições novamente"
        );

        // Verificar novamente as condições após o timeout
        if (
          !isModalOpen &&
          !modalAlreadyOpened &&
          !modalProcessingRef.current &&
          status === "LOADING"
        ) {
          // Marcar como processando para evitar execuções duplas
          modalProcessingRef.current = true;

          console.log("🚀 [LoginPage] Abrindo modal:", {
            isAdmin: currentUser.isAdmin,
            basesParaUsuarioLength: basesParaUsuario.length,
            hasBasesToShow: currentUser.isAdmin || basesParaUsuario.length > 0,
          });

          // Para admin: sempre abrir o modal (mesmo sem bases)
          // Para usuário normal: só abrir se tiver bases
          if (currentUser.isAdmin || basesParaUsuario.length > 0) {
            // Garantir que só execute uma vez por login
            setModalAlreadyOpened(true);
            setIsModalOpen(true);
            setStatus("IDLE");
          } else {
            console.log(
              "❌ [LoginPage] Nenhuma base disponível para usuário não-admin"
            );
            setError("Você não possui nenhuma base de dados associada.");
            setStatus("ERROR");
            logout();
          }
        }
        // Limpar a referência do timeout após execução
        modalTimeoutRef.current = null;
      }, 200); // Aumentar o delay para 200ms para dar tempo das bases carregarem
    }
  }, [
    currentUser,
    authLoading,
    allBases,
    status,
    isModalOpen,
    modalAlreadyOpened,
    basesParaUsuario, // Usar o array completo para reagir a mudanças nas bases
    logout,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "LOADING") return;

    setError(null);
    setStatus("LOADING");
    setModalAlreadyOpened(false); // Reset do flag
    modalProcessingRef.current = false; // Reset do flag de processamento

    // Limpar timeout se existir
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }

    try {
      await login(email, password);
      // O useEffect acima cuidará do resto quando currentUser for atualizado
    } catch (error) {
      setError("E-mail ou senha inválidos. Verifique suas credenciais.");
      setStatus("ERROR");
    }
  };

  // Estabilizar as props para o modal usando useMemo
  const modalProps = useMemo(
    () => ({
      isOpen: isModalOpen,
      onClose: stableHandleModalClose,
      onSelectBase: stableHandleBaseSelected,
      bases: basesParaUsuario as ExtendedBase[],
      isAdmin: !!currentUser?.isAdmin,
    }),
    [
      isModalOpen,
      stableHandleModalClose,
      stableHandleBaseSelected,
      basesParaUsuario,
      currentUser?.isAdmin,
    ]
  );

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
      <AccessSelectionModal {...modalProps} />
    </div>
  );
}
