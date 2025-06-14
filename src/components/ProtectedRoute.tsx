import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react'; // Para um spinner melhor

const ProtectedRoute = () => {
  // 'loading' (renomeado para authLoading) cobre o estado inicial de verificação do currentUser.
  // selectedBaseId é carregado de forma síncrona do localStorage no hook useAuth.
  const { currentUser, loading: authLoading, selectedBaseId } = useAuth();
  const location = useLocation();

  if (authLoading) { // Se ainda está verificando o usuário
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    // Usuário não logado, redireciona para login, guardando a rota de origem.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuário logado, mas precisa selecionar uma base
  if (!selectedBaseId) {
    // Redireciona para /login, onde o modal de seleção de base deve aparecer.
    return <Navigate to="/login" replace />;
  }

  // Usuário logado E com base selecionada, permite acesso à rota protegida.
  return <Outlet />;
};

export default ProtectedRoute;