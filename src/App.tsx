import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import { BotaoFlutuanteTransacao } from "./components/BotaoFlutuanteTransacao";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useStores } from "./hooks/useStores.simple.v2";
import AdminDashboard from "./pages/AdminPage/AdminDashboard";
import CategoriaPage from "./pages/CategoriaPage";
import { EditarClienteFornecedor } from "./pages/cliente/components/EditarClienteFornecedor";
import DREPage from "./pages/DREPage";
import EditarPerfilPage from "./pages/EditarPerfilPage";
import FechamentoPage from "./pages/FechamentoPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { GerenciarClientesFornecedoresPage } from "./pages/GerenciarClientesFornecedoresPage";
import GerenciarFormaPagamentoPage from "./pages/GerenciarFormaPagamentoPage";
import { EditarLojaPage } from "./pages/gerenciarLojas/EditarLojaPage";
import { GerenciarLojasPage } from "./pages/gerenciarLojas/GerenciarLojasPage";
import { NovaLojaPage } from "./pages/gerenciarLojas/NovaLojaPage";
import GerenciarTipoMovimentacaoPage from "./pages/GerenciarTipoMovimentacaoPage";
import GerenciarUsuarioPage from "./pages/GerenciarUsuarioPage";
import { ContratoBase } from "./pages/gestaoBases/ContratoBase";
import { FormularioBase } from "./pages/gestaoBases/FormularioBase";
import { GestaoBasesPage } from "./pages/gestaoBases/GestaoBasesPage";
import Index from "./pages/Index";
import InvitePage from "./pages/InvitePage";
import LoginPage from "./pages/LoginPage";
import LojaPage from "./pages/LojaPage";
import MetaPage from "./pages/MetaPage";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import SettingsPage from "./pages/SettingsPage";
import SignupPage from "./pages/SignupPage";
import TransacoesPage from "./pages/transacoes/TransacoesPage";
import FormularioUsuario from "./pages/usuariosGlobal/FormularioUsuario";
import GerenciarUsuariosGlobalPage from "./pages/usuariosGlobal/GerenciarUsuariosGlobalPage";
import { supabase } from "./supabaseClient";
import { accessToken as storageAccessToken } from "./utils/storage";

const queryClient = new QueryClient();

const ProtectedPagesLayout = () => {
  const location = useLocation();
  const showFAB =
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/convite");

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {showFAB && <BotaoFlutuanteTransacao />}
    </>
  );
};
const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ErrorBoundary>
);

const AppContent = () => {
  // Títulos das rotas
  const routeTitles = useMemo(
    () => ({
      "/": "Visão Geral",
      "/transacao": "Transações",
      "/categoria": "Categorias",
      "/loja": "Lojas",
      "/loja/editar-loja/:baseId": "Editar Loja",
      "/loja/criar-loja": "Criar loja",
      "/fechamento": "Fechamentos",
      "/dre": "DRE",
      "/meta": "Metas",
      "/forma-pagamento": "Formas de Pagamento",
      "/gerenciar-forma-pagamento": "Formas de Pagamento",
      "/gerenciar-usuario": "Gerenciar Usuários",
      "/gerenciar-tipo-movimentacao": "Gerenciar Tipos de Movimentação",
      "/editar-perfil": "Editar Perfil",
      "/settings": "Configurações",
      "/clientes-fornecedores/novo": "Novo Cliente/Fornecedor",
      "/clientes-fornecedores/editar/:id": "Editar Cliente/Fornecedor",
      "/clientes-fornecedores": "Clientes e Fornecedores",
      "/gerenciar-lojas": "Gerenciar Lojas",
      "/gerenciar-lojas/novo": "Nova Loja",
      "/gerenciar-lojas/editar/:id": "Editar Loja",
      "/admin/gestao-bases": "Gestão de Bases",
      "/admin/gestao-bases/nova": "Nova Base",
      "/admin/gestao-bases/editar/:id": "Editar Base",
      "/admin/gestao-bases/contrato/:id": "Contrato da Base",
      "/admin/gestao-bases/usuarios/:id": "Usuários da Base",
      "/admin/gerenciar-usuarios-global/novo": "Novo Usuário",
      "/admin/gerenciar-usuarios-global/editar/:uid": "Editar Usuário",
      "/admin/gerenciar-usuarios-global": "Usuários",
      "/login": "Login",
      "/signup": "Criar Conta",
      "*": "Página Não Encontrada",
    }),
    []
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, accessToken } = useAuth();
  const { bases } = useStores();
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [showBaseModal, setShowBaseModal] = useState(false);

  // Controle de sessão - redireciona usuário logado para home se tentar acessar páginas de auth
  useEffect(() => {
    if (currentUser && !authLoading) {
      const authPages = ["/login", "/signup", "/forgot-password"];
      const isAuthPage = authPages.some((page) =>
        location.pathname.startsWith(page)
      );

      if (isAuthPage) {
        navigate("/", { replace: true });
      }
    }
  }, [currentUser, authLoading, location.pathname, navigate]);

  // Controle automático do access token (verificação menos agressiva)
  useEffect(() => {
    const checkTokenExpiry = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session && currentUser) {
          // Token expirado ou não existe, mas usuário ainda está "logado"
          console.log("Token expirado, fazendo logout automático");
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        // Em caso de erro na verificação, não faz logout automático
      }
    };

    // Verificar token a cada 5 minutos (menos agressivo)
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    // Verificar também quando a aba volta ao foco
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        checkTokenExpiry();
      }
    };

    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [currentUser]);

  // Redireciona para /invite se houver hash de convite/recovery em qualquer rota
  useEffect(() => {
    if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      const error = hashParams.get("error");

      // Se já está logado e não é recovery, redireciona para home
      if (currentUser && !authLoading && type !== "recovery") {
        navigate("/", { replace: true });
        return;
      }

      // Recuperação de senha vai para /reset-password
      if (accessToken && type === "recovery") {
        if (!location.pathname.startsWith("/reset-password")) {
          navigate(`/reset-password${location.hash}`, { replace: true });
          return;
        }
      }

      // Convites ou erros vão para /invite
      if ((accessToken && type !== "recovery") || error) {
        if (!location.pathname.startsWith("/invite")) {
          navigate(`/invite${location.hash}`, { replace: true });
          return;
        }
      }
    }

    // Se não há hash mas está na página de reset-password, redireciona para login
    if (location.pathname.startsWith("/reset-password") && !location.hash) {
      navigate("/login", { replace: true });
      return;
    }
  }, [location, navigate, currentUser, authLoading]);

  // Redireciona para convite se usuário logado precisa definir senha
  useEffect(() => {
    // Se precisar lógica de needsPasswordSetup, ajuste conforme o modelo real do usuário
    // if (
    //   currentUser &&
    //   !authLoading &&
    //   currentUser.needsPasswordSetup &&
    //   !location.pathname.startsWith("/invite") &&
    //   !location.pathname.startsWith("/convite")
    // ) {
    //   window.location.href = "/invite";
    // }
  }, [currentUser, authLoading, location.pathname]);
  // (Removido trecho duplicado/solto de rotas)

  useEffect(() => {
    const pageTitle =
      (location.pathname.startsWith("/clientes-fornecedores/novo")
        ? routeTitles["/clientes-fornecedores/novo"]
        : location.pathname.startsWith("/clientes-fornecedores/editar/")
        ? routeTitles["/clientes-fornecedores/editar/:id"]
        : location.pathname.startsWith("/gerenciar-lojas/novo")
        ? routeTitles["/gerenciar-lojas/novo"]
        : location.pathname.startsWith("/gerenciar-lojas/editar/")
        ? routeTitles["/gerenciar-lojas/editar/:id"]
        : location.pathname.startsWith("/loja/editar-loja/")
        ? routeTitles["/loja/editar-loja/:baseId"]
        : location.pathname.startsWith("/admin/gestao-bases/nova")
        ? routeTitles["/admin/gestao-bases/nova"]
        : location.pathname.startsWith("/admin/gestao-bases/editar/")
        ? routeTitles["/admin/gestao-bases/editar/:id"]
        : location.pathname.startsWith("/admin/gestao-bases/contrato/")
        ? routeTitles["/admin/gestao-bases/contrato/:id"]
        : location.pathname.startsWith("/admin/gestao-bases/usuarios/")
        ? routeTitles["/admin/gestao-bases/usuarios/:id"]
        : location.pathname.startsWith("/admin/gerenciar-usuarios-global/novo")
        ? routeTitles["/admin/gerenciar-usuarios-global/novo"]
        : location.pathname.startsWith(
            "/admin/gerenciar-usuarios-global/editar/"
          )
        ? routeTitles["/admin/gerenciar-usuarios-global/editar/:uid"]
        : routeTitles[location.pathname]) || routeTitles["*"];
    document.title = `Financeiro App - ${pageTitle}`;
  }, [location.pathname, routeTitles]);
  // Seleção automática ou modal de base
  useEffect(() => {
    // Não mostrar modal em rotas públicas
    const isPublicRoute = [
      "/login",
      "/signup",
      "/invite",
      "/convite",
      "/reset-password",
      "/forgot-password",
    ].some((r) => location.pathname.startsWith(r));

    if (!currentUser || authLoading || isPublicRoute) {
      setShowBaseModal(false);
      return;
    }

    // ADMIN: só mostra modal se não tiver base selecionada E tiver bases disponíveis
    if (currentUser.admin) {
      if (!selectedBaseId && bases.length > 0) {
        setShowBaseModal(true);
      }
      return;
    }

    // Usuário comum
    if (bases.length === 0) {
      setSelectedBaseId(null);
      setShowBaseModal(false);
      return;
    }
    if (bases.length === 1) {
      setSelectedBaseId(bases[0].id);
      setShowBaseModal(false);
      return;
    }
    // Usuário com múltiplas bases
    if (!selectedBaseId) {
      setShowBaseModal(true);
    }
  }, [currentUser, authLoading, bases, location.pathname, selectedBaseId]);

  // Se usuário trocar, resetar base selecionada
  useEffect(() => {
    setSelectedBaseId(null);
    setShowBaseModal(false);
  }, [currentUser?.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showBaseModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 32,
                borderRadius: 8,
                minWidth: 320,
              }}
            >
              <h2>Selecione a base de acesso</h2>
              {currentUser?.admin && (
                <p
                  style={{ fontSize: "14px", color: "#666", marginBottom: 16 }}
                >
                  Como admin, você pode acessar qualquer base ou continuar sem
                  selecionar uma.
                </p>
              )}
              <ul style={{ listStyle: "none", padding: 0 }}>
                {bases.map((b) => (
                  <li key={b.id} style={{ margin: "12px 0" }}>
                    <button
                      style={{ padding: 8, width: "100%" }}
                      onClick={() => {
                        setSelectedBaseId(b.id);
                        setShowBaseModal(false);

                        // Salvar access token no localStorage após seleção da base
                        if (accessToken) {
                          storageAccessToken.set(accessToken);
                          console.log(
                            "Access token salvo no localStorage após seleção da base"
                          );
                        }
                      }}
                    >
                      {b.name || b.id}
                    </button>
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {currentUser?.admin && (
                  <button
                    style={{
                      padding: 8,
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                    }}
                    onClick={() => {
                      setSelectedBaseId(null);
                      setShowBaseModal(false);

                      // Salvar access token no localStorage após continuar sem base
                      if (accessToken) {
                        storageAccessToken.set(accessToken);
                        console.log(
                          "Access token salvo no localStorage após continuar sem base"
                        );
                      }
                    }}
                  >
                    Continuar sem base
                  </button>
                )}
                <button
                  style={{
                    padding: 8,
                    color: "red",
                    background: "transparent",
                    border: "1px solid red",
                  }}
                  onClick={() => {
                    setShowBaseModal(false);
                    setSelectedBaseId(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedPagesLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/transacao" element={<TransacoesPage />} />
                <Route path="/categoria" element={<CategoriaPage />} />
                <Route path="/loja" element={<LojaPage />} />
                <Route path="/loja/criar-loja" element={<NovaLojaPage />} />
                <Route
                  path="/loja/editar-loja/:id"
                  element={<EditarLojaPage />}
                />
                <Route path="/fechamento" element={<FechamentoPage />} />
                <Route path="/dre" element={<DREPage />} />
                <Route path="/meta" element={<MetaPage />} />
                <Route
                  path="/forma-pagamento"
                  element={<GerenciarFormaPagamentoPage />}
                />
                <Route
                  path="/gerenciar-usuario"
                  element={<GerenciarUsuarioPage />}
                />
                <Route
                  path="/gerenciar-tipo-movimentacao"
                  element={<GerenciarTipoMovimentacaoPage />}
                />
                <Route path="/editar-perfil" element={<EditarPerfilPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/clientes-fornecedores"
                  element={<GerenciarClientesFornecedoresPage />}
                />
                <Route
                  path="/clientes-fornecedores/novo"
                  element={<EditarClienteFornecedor />}
                />
                <Route
                  path="/clientes-fornecedores/editar/:id"
                  element={<EditarClienteFornecedor />}
                />
                <Route
                  path="/gerenciar-lojas"
                  element={<GerenciarLojasPage />}
                />
                <Route
                  path="/gerenciar-lojas/novo"
                  element={<NovaLojaPage />}
                />
                <Route
                  path="/gerenciar-lojas/editar/:id"
                  element={<EditarLojaPage />}
                />
              </Route>
            </Route>
            {/* Agrupar todas as rotas de admin sob /admin */}
            <Route
              path="/admin"
              element={<ProtectedRoute allowedRoles={["admin"]} />}
            >
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="gestao-bases" element={<GestaoBasesPage />} />
                <Route path="gestao-bases/nova" element={<FormularioBase />} />
                <Route
                  path="gestao-bases/editar/:baseId"
                  element={<FormularioBase />}
                />
                <Route
                  path="gestao-bases/contrato/:baseId"
                  element={<ContratoBase />}
                />
                <Route
                  path="gerenciar-usuarios-global"
                  element={<GerenciarUsuariosGlobalPage />}
                />
                <Route
                  path="gerenciar-usuarios-global/novo"
                  element={<FormularioUsuario />}
                />
                <Route
                  path="gerenciar-usuarios-global/editar/:uid"
                  element={<FormularioUsuario />}
                />
                {/* Rotas de compatibilidade */}
                <Route
                  path="store-management"
                  element={<Navigate to="/admin/gestao-bases" replace />}
                />
              </Route>
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!location.pathname.startsWith("/admin") && <Footer />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
