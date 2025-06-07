import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigate } from "react-router-dom"; // Importar Navigate
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage"; 
// import SignupPage from "./pages/SignupPage"; // Página de signup não será mais usada
import ProtectedRoute from "./components/ProtectedRoute";
import SettingsPage from "./pages/SettingsPage";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import TransacaoPage from "./pages/TransacaoPage";
import CategoriaPage from "./pages/CategoriaPage";
import LojaPage from "./pages/LojaPage";
import FechamentoPage from "./pages/FechamentoPage";
import DREPage from "./pages/DREPage";
import MetaPage from "./pages/MetaPage";
import GerenciarFormaPagamentoPage from "./pages/GerenciarFormaPagamentoPage";
import GerenciarUsuarioPage from "./pages/GerenciarUsuarioPage";
import GerenciarTipoMovimentacaoPage from "./pages/GerenciarTipoMovimentacaoPage";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import EditarPerfilPage from "./pages/EditarPerfilPage";
import AdminPage from "./pages/AdminPage";
import AdminLayout from "./components/AdminLayout";
import GerenciarUsuariosGlobalPage from "./pages/AdminPage/GerenciarUsuariosGlobalPage"; // Certifique-se que a importação está correta
import { AccessSelectionModal } from "./components/AccessSelectionModal";
import InvitePage from "./pages/InvitePage";
import { useStores } from "./hooks/useStores";

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
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const routeTitles: Record<string, string> = {
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
    "/login": "Login",
    "/signup": "Criar Conta",
    "*": "Página Não Encontrada",
  };

  useEffect(() => {
    const pageTitle = routeTitles[location.pathname] || routeTitles["*"];
    document.title = `Financeiro App - ${pageTitle}`;
  }, [location.pathname, routeTitles]);

  useEffect(() => {
    if (
      !authLoading &&
      currentUser &&
      !sessionStorage.getItem("adminModalDismissed")
    ) {
      setIsAdminModalOpen(true);
    }
  }, [currentUser, authLoading]);
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
              </Route>
            </Route>
            {/* Agrupar todas as rotas de admin sob /admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="store-management" replace />} /> {/* Redireciona /admin para /admin/store-management */}
                <Route path="store-management" element={<AdminPage />} />
                <Route path="gerenciar-usuarios-global" element={<GerenciarUsuariosGlobalPage />} />
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
        {currentUser && isAdminModalOpen && (
          <AccessSelectionModal
            isOpen={isAdminModalOpen}
            onClose={() => {
              setIsAdminModalOpen(false);
              sessionStorage.setItem("adminModalDismissed", "true");
            }}
            bases={bases}
            isAdmin={!!currentUser?.isAdmin} // Passa a flag isAdmin
          />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
