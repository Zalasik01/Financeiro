import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"; // Importar Navigate
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
// import SignupPage from "./pages/SignupPage"; // Página de signup não será mais usada
import { useEffect, useMemo } from "react"; // Adicionado useMemo
import AdminLayout from "./components/AdminLayout";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar"; // Corrigido: Navbar já estava importado
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useStores } from "./hooks/useStores";
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./pages/AdminPage/AdminDashboard";
import GerenciarUsuariosGlobalPage from "./pages/AdminPage/GerenciarUsuariosGlobalPage"; // Certifique-se que a importação está correta
import CategoriaPage from "./pages/CategoriaPage";
import DREPage from "./pages/DREPage";
import EditarPerfilPage from "./pages/EditarPerfilPage";
import FechamentoPage from "./pages/FechamentoPage";
import { GerenciarClientesFornecedoresPage } from "./pages/GerenciarClientesFornecedoresPage"; // Importar a nova página
import GerenciarFormaPagamentoPage from "./pages/GerenciarFormaPagamentoPage";
import GerenciarTipoMovimentacaoPage from "./pages/GerenciarTipoMovimentacaoPage";
import GerenciarUsuarioPage from "./pages/GerenciarUsuarioPage";
import InvitePage from "./pages/InvitePage";
import LojaPage from "./pages/LojaPage";
import MetaPage from "./pages/MetaPage";
import { PaginaClienteFornecedor } from "./pages/PaginaClienteFornecedor";
import SettingsPage from "./pages/SettingsPage";
import TransacaoPage from "./pages/TransacaoPage";

const queryClient = new QueryClient();

const ProtectedPagesLayout = () => (
  <>
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
  </>
);
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </BrowserRouter>
);

const AppContent = () => {
  const location = useLocation();
  const { currentUser, loading: authLoading, setSelectedBaseId } = useAuth();
  const { bases } = useStores();

  const routeTitles = useMemo(
    (): Record<string, string> => ({
      "/": "Visão Geral",
      "/transacao": "Transações",
      "/categoria": "Categorias",
      "/loja": "Lojas",
      "/fechamento": "Fechamentos",
      "/dre": "DRE",
      "/meta": "Metas",
      "/forma-pagamento": "Formas de Pagamento",
      "/gerenciar-forma-pagamento": "Formas de Pagamento",
      "/gerenciar-usuario": "Gerenciar Usuários",
      "/gerenciar-tipo-movimentacao": "Gerenciar Tipos de Movimentação",
      "/editar-perfil": "Editar Perfil",
      "/settings": "Configurações",
      "/clientes-fornecedores/editar/:id": "Editar Cliente/Fornecedor",
      "/clientes-fornecedores/novo": "Novo Cliente/Fornecedor", // Título para a página de novo cadastro
      "/clientes-fornecedores": "Clientes e Fornecedores", // Adicionar título para a nova rota
      "/login": "Login",
      "/signup": "Criar Conta",
      "*": "Página Não Encontrada",
    }),
    []
  );

  useEffect(() => {
    const pageTitle =
      routeTitles[location.pathname] ||
      (location.pathname.startsWith("/clientes-fornecedores/editar/")
        ? routeTitles["/clientes-fornecedores/editar/:id"]
        : routeTitles["*"]);
    document.title = `Financeiro App - ${pageTitle}`;
  }, [location.pathname, routeTitles]); // routeTitles is now stable due to useMemo
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
                <Route path="/transacao" element={<TransacaoPage />} />
                <Route path="/categoria" element={<CategoriaPage />} />
                <Route path="/loja" element={<LojaPage />} />
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
                  element={<PaginaClienteFornecedor />}
                />
                <Route
                  path="/clientes-fornecedores/editar/:id"
                  element={<PaginaClienteFornecedor />}
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
                <Route path="gestao-bases" element={<AdminPage />} />
                <Route
                  path="gerenciar-usuarios-global"
                  element={<GerenciarUsuariosGlobalPage />}
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
            {/* <Route path="/signup" element={<SignupPage />} />  // Rota de signup removida */}
            <Route path="/convite/:inviteToken" element={<InvitePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!location.pathname.startsWith("/admin") && <Footer />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
