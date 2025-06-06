import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom"; // Adicionar useLocation
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage"; // Importar LoginPage
import SignupPage from "./pages/SignupPage"; // Importar SignupPage
import ProtectedRoute from "./components/ProtectedRoute"; // Importar ProtectedRoute
import SettingsPage from "./pages/SettingsPage";
import { AuthProvider, useAuth } from "./hooks/useAuth"; // Importar AuthProvider e useAuth
import TransacaoPage from "./pages/TransacaoPage";
import CategoriaPage from "./pages/CategoriaPage";
import LojaPage from "./pages/LojaPage";
import FechamentoPage from "./pages/FechamentoPage";
import DREPage from "./pages/DREPage";
import MetaPage from "./pages/MetaPage"; // Importar AuthProvider
import GerenciarFormaPagamentoPage from "./pages/GerenciarFormaPagamentoPage";
import GerenciarUsuarioPage from "./pages/GerenciarUsuarioPage";
import GerenciarTipoMovimentacaoPage from "./pages/GerenciarTipoMovimentacaoPage";
import { useEffect, useState } from "react"; // Importar useEffect e useState
import Navbar from "./components/Navbar"; // Importar o Navbar
import Footer from "./components/Footer"; // 1. Importar o Footer
import EditarPerfilPage from "./pages/EditarPerfilPage"; // Importar a nova página
import AdminPage from "./pages/AdminPage"; // Importar a página de Admin
import AdminLayout from "./components/AdminLayout"; // Importar o AdminLayout
import { AccessSelectionModal } from "./components/AccessSelectionModal"; // Corrigido o nome da importação
import InvitePage from "./pages/InvitePage"; // Importar a InvitePage
import { useStores } from "./hooks/useStores"; // Para obter a lista de lojas para o modal

const queryClient = new QueryClient();

// Componente de Layout para rotas protegidas que inclui o Navbar
const ProtectedPagesLayout = () => (
  <>
    <Navbar />
    <main className="flex-grow">
      {" "}
      {/* 2. Adicionar flex-grow para o conteúdo principal */}
      <Outlet /> {/* O conteúdo da rota filha será renderizado aqui */}
    </main>
  </>
);
const App = () => (
  // Mover BrowserRouter para envolver AppContent
  <BrowserRouter>
    <AuthProvider>
      {" "}
      {/* Envolver AppContent com AuthProvider aqui */}
      <AppContent />
    </AuthProvider>
  </BrowserRouter>
);

// Componente separado para usar hooks como useLocation
const AppContent = () => {
  const location = useLocation();
  // Garanta que useAuth() seja chamado e currentUser desestruturado no topo.
  const { currentUser, loading: authLoading, setSelectedBaseId } = useAuth(); // Adicionar setSelectedBaseId
  const { bases } = useStores(); // Alterado para obter bases
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Mapeamento de rotas para títulos de página
  const routeTitles: Record<string, string> = {
    "/": "Visão Geral",
    "/transacao": "Transações",
    "/categoria": "Categorias",
    "/loja": "Lojas",
    "/fechamento": "Fechamentos",
    "/dre": "DRE",
    "/meta": "Metas",
    "/forma-pagamento": "Formas de Pagamento",
    "/gerenciar-forma-pagamento": "Formas de Pagamento", // Assumindo o mesmo título
    "/gerenciar-usuario": "Gerenciar Usuários",
    "/gerenciar-tipo-movimentacao": "Gerenciar Tipos de Movimentação",
    "/editar-perfil": "Editar Perfil",
    "/login": "Login",
    "/signup": "Criar Conta",
    "*": "Página Não Encontrada", // Fallback para rotas não encontradas
  };

  useEffect(() => {
    const pageTitle = routeTitles[location.pathname] || routeTitles["*"];
    document.title = `Financeiro App - ${pageTitle}`;
  }, [location.pathname]); // Atualiza o título sempre que a rota muda

  useEffect(() => {
    // Abrir o modal de acesso admin se o usuário for admin e o modal ainda não foi aberto nesta sessão
    console.log("[AdminModalCheck] Verificando condições:", {
      authLoading,
      currentUserExists: !!currentUser,
      isAdmin: currentUser?.isAdmin,
      isDismissed: sessionStorage.getItem("adminModalDismissed"),
    });
    if (
      !authLoading && // Garante que o estado de autenticação esteja carregado
      currentUser && // Abre para qualquer usuário logado
      !sessionStorage.getItem("adminModalDismissed")
    ) {
      console.log("[AdminModalCheck] Abrindo modal!");
      setIsAdminModalOpen(true);
    }
  }, [currentUser, authLoading]);

  // Efeito para definir selectedBaseId (UUID) com base no clientBaseId (numberId) do perfil do usuário
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
        console.log(
          `[AppContent] Usuário não admin, base ${userProfileBaseNumberId} encontrada: ${matchingBase.id}. Definindo selectedBaseId.`
        );
        setSelectedBaseId(matchingBase.id); // matchingBase.id é o UUID
      } else {
        console.warn(
          `[AppContent] Base com numberId ${userProfileBaseNumberId} do perfil do usuário não encontrada na lista de bases. selectedBaseId permanece null.`
        );
        setSelectedBaseId(null);
      }
    } else if (currentUser && currentUser.isAdmin) {
      // Para admin, selectedBaseId é gerenciado pelo modal ou permanece null
      // Não fazemos nada aqui, pois o modal ou outras ações definirão.
    } else if (
      currentUser &&
      !currentUser.isAdmin &&
      (currentUser.clientBaseId === null ||
        currentUser.clientBaseId === undefined)
    ) {
      // Usuário não admin sem base vinculada no perfil
      setSelectedBaseId(null);
    }
    // Não incluir setSelectedBaseId nas dependências para evitar loop se ele for chamado dentro do efeito.
    // A lógica depende de currentUser e bases.
  }, [currentUser, bases]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* O Navbar pode ser colocado aqui se for global, ou dentro de ProtectedRoute se for apenas para rotas protegidas */}
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route element={<ProtectedRoute />}>
              {" "}
              {/* Protege as rotas aninhadas */}
              <Route element={<ProtectedPagesLayout />}>
                {" "}
                {/* Aplica o layout com Navbar */}
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
              </Route>
            </Route>
            {/* Rota Admin com layout próprio, ainda protegida */}
            <Route path="/admin/store-management" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                {" "}
                {/* AdminLayout tem seu próprio Outlet */}
                <Route index element={<AdminPage />} />
              </Route>
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/convite/:inviteToken" element={<InvitePage />} />{" "}
            {/* Nova rota para convites */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!location.pathname.startsWith("/admin") && <Footer />}{" "}
          {/* Renderiza o Footer global exceto em rotas admin */}
        </div>
        {/* O modal agora abre para qualquer usuário logado, se isAdminModalOpen for true */}
        {currentUser && isAdminModalOpen && (
          <AccessSelectionModal
            isOpen={isAdminModalOpen}
            onClose={() => {
              setIsAdminModalOpen(false);
              sessionStorage.setItem("adminModalDismissed", "true"); // Marcar como dispensado na sessão
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
