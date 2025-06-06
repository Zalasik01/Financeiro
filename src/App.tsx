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
import { AuthProvider } from "./hooks/useAuth"; // Importar AuthProvider
import TransacaoPage from "./pages/TransacaoPage";
import CategoriaPage from "./pages/CategoriaPage";
import LojaPage from "./pages/LojaPage";
import FechamentoPage from "./pages/FechamentoPage";
import DREPage from "./pages/DREPage";
import MetaPage from "./pages/MetaPage";
import GerenciarFormaPagamentoPage from "./pages/GerenciarFormaPagamentoPage";
import GerenciarUsuarioPage from "./pages/GerenciarUsuarioPage";
import GerenciarTipoMovimentacaoPage from "./pages/GerenciarTipoMovimentacaoPage";
import { useEffect } from "react"; // Importar useEffect
import Navbar from "./components/Navbar"; // Importar o Navbar
import Footer from "./components/Footer"; // 1. Importar o Footer
import EditarPerfilPage from "./pages/EditarPerfilPage"; // Importar a nova página

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
    <AppContent />
  </BrowserRouter>
);

// Componente separado para usar hooks como useLocation
const AppContent = () => {
  const location = useLocation();

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

  return (
    <AuthProvider>
      {" "}
      {/* Envolver com AuthProvider */}
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
                    path="/gerenciar-forma-pagamento"
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />{" "}
            {/* 3. Adicionar o Footer aqui, fora das Routes mas dentro do layout principal */}
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};
export default App;
