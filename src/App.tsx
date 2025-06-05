import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // prettier-ignore
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"; // Adicionar Outlet
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
import Navbar from "./components/Navbar"; // Importar o Navbar

const queryClient = new QueryClient();

// Componente de Layout para rotas protegidas que inclui o Navbar
const ProtectedPagesLayout = () => (
  <>
    <Navbar />
    <Outlet /> {/* O conteúdo da rota filha será renderizado aqui */}
  </>
);
const App = () => (
  <AuthProvider>
    {" "}
    {/* Envolver com AuthProvider */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
                </Route>
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
