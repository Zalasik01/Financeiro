import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo } from "react"; // Adicionado useMemo
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"; // Importar Navigate
import AdminLayout from "./components/AdminLayout";
import { BotaoFlutuanteTransacao } from "./components/BotaoFlutuanteTransacao";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useStores } from "./hooks/useStores";
import AdminDashboard from "./pages/AdminPage/AdminDashboard";
import CategoriaPage from "./pages/CategoriaPage";
import { EditarClienteFornecedor } from "./pages/cliente/components/EditarClienteFornecedor";
import DREPage from "./pages/DREPage";
import EditarPerfilPage from "./pages/EditarPerfilPage";
import FechamentoPage from "./pages/FechamentoPage";
import { GerenciarClientesFornecedoresPage } from "./pages/GerenciarClientesFornecedoresPage"; // Importar a nova página
import GerenciarFormaPagamentoPage from "./pages/GerenciarFormaPagamentoPage";
import { EditarLojaPage } from "./pages/gerenciarLojas/EditarLojaPage";
import { GerenciarLojasPage } from "./pages/gerenciarLojas/GerenciarLojasPage";
import { NovaLojaPage } from "./pages/gerenciarLojas/NovaLojaPage";
import GerenciarTipoMovimentacaoPage from "./pages/GerenciarTipoMovimentacaoPage";
import GerenciarUsuarioPage from "./pages/GerenciarUsuarioPage";
import { ContratoBase } from "./pages/gestaoBases/ContratoBase"; // Nova importação
import { FormularioBase } from "./pages/gestaoBases/FormularioBase"; // Nova importação
import { GestaoBasesPage } from "./pages/gestaoBases/GestaoBasesPage"; // Nova importação
import Index from "./pages/Index";
import InvitePage from "./pages/InvitePage";
import LoginPage from "./pages/LoginPage";
import LojaPage from "./pages/LojaPage";
import MetaPage from "./pages/MetaPage";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/SettingsPage";
import SignupPage from "./pages/SignupPage";
import TransacoesPage from "./pages/transacoes/TransacoesPage";
import FormularioUsuario from "./pages/usuariosGlobal/FormularioUsuario";
import GerenciarUsuariosGlobalPage from "./pages/usuariosGlobal/GerenciarUsuariosGlobalPage"; // Novo componente

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
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

const AppContent = () => {
  const location = useLocation();
  const {
    currentUser,
    loading: authLoading,
    selectedBaseId,
    setSelectedBaseId,
  } = useAuth();
  const { bases } = useStores();

  // Redireciona para /invite se houver hash de convite/recovery em qualquer rota (exceto já estando em /invite)
  useEffect(() => {
    if (!location.pathname.startsWith("/invite") && location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      const error = hashParams.get("error");

      if ((accessToken && type === "recovery") || error) {
        window.location.replace(`/invite${location.hash}`);
        return;
      }
    }
  }, [location.pathname, location.hash]);

  const routeTitles = useMemo(
    (): Record<string, string> => ({
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
  useEffect(() => {
    if (
      currentUser &&
      !currentUser.isAdmin &&
      currentUser.clientBaseId !== null &&
      currentUser.clientBaseId !== undefined &&
      bases.length > 0
    ) {
      const userProfileBaseNumberId = currentUser.clientBaseId;
      const matchingBase = bases.find(
        (b) => b.numberId === userProfileBaseNumberId
      );

      if (matchingBase) {
        setSelectedBaseId(matchingBase.id);
      } else {
        setSelectedBaseId(null);
      }
    } else if (currentUser && currentUser.isAdmin) {
      // selectedBaseId for admin is handled by modal or other actions
    } else if (
      currentUser &&
      !currentUser.isAdmin &&
      (currentUser.clientBaseId === null ||
        currentUser.clientBaseId === undefined)
    ) {
      setSelectedBaseId(null);
    }
  }, [currentUser, bases, setSelectedBaseId]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
                {/* Outras sub-rotas do admin podem vir aqui */}
              </Route>
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/convite/:inviteToken" element={<InvitePage />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!location.pathname.startsWith("/admin") && <Footer />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
