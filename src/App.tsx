import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Outlet, Routes, useLocation, useNavigate } from "react-router-dom"; // Importar Navigate e useNavigate
import { BotaoFlutuanteTransacao } from "./components/BotaoFlutuanteTransacao";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useStores } from "./hooks/useStores";

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
  const { currentUser, loading: authLoading } = useAuth();
  const { bases } = useStores();
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [showBaseModal, setShowBaseModal] = useState(false);

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
  }, [location]);

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
    const isPublicRoute = ["/login", "/signup", "/invite", "/convite"].some(
      (r) => location.pathname.startsWith(r)
    );
    if (!currentUser || authLoading || isPublicRoute) {
      setShowBaseModal(false);
      return;
    }
    // ADMIN: pode selecionar qualquer base
    if (currentUser.admin) {
      setShowBaseModal(true);
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
    setShowBaseModal(true);
  }, [currentUser, authLoading, bases, location.pathname]);

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
              <ul style={{ listStyle: "none", padding: 0 }}>
                {bases.map((b) => (
                  <li key={b.id} style={{ margin: "12px 0" }}>
                    <button
                      style={{ padding: 8, width: "100%" }}
                      onClick={() => {
                        setSelectedBaseId(b.id);
                        setShowBaseModal(false);
                      }}
                    >
                      {b.name || b.id}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                style={{ marginTop: 16, color: "red" }}
                onClick={() => {
                  setShowBaseModal(false);
                  setSelectedBaseId(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col min-h-screen">
          <Routes>{/* ...existing code... */}</Routes>
          {!location.pathname.startsWith("/admin") && <Footer />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
