import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react"; // Para um spinner melhor
import { Navigate, Outlet, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    // Se ainda está verificando o usuário
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

  // Se há roles específicas exigidas, verificar se o usuário tem acesso
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => {
      if (role === "admin") return currentUser.admin;
      // Aqui você pode adicionar outros roles conforme necessário
      return false;
    });

    if (!hasRequiredRole) {
      // Usuário não tem permissão, redireciona para página inicial
      return <Navigate to="/" replace />;
    }
  }

  // Usuário logado, permite acesso à rota protegida
  // A seleção de base é gerenciada pelo modal no App.tsx
  return <Outlet />;
};

export default ProtectedRoute;
