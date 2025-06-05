import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Você pode exibir um spinner/indicador de carregamento aqui
    // enquanto o estado de autenticação está sendo verificado.
    return <div>Carregando autenticação...</div>;
  }

  if (!currentUser) {
    // Redireciona para a página de login, guardando a localização atual
    // para que o usuário possa ser redirecionado de volta após o login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza o conteúdo da rota filha se autenticado
};

export default ProtectedRoute;