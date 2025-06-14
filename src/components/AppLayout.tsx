import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
import { useMemo } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { AccessSelectionModal } from "@/components/AccessSelectionModal";
import { Loader2 } from "lucide-react";

const FullScreenLoader = () => (
  <div 
      className="flex items-center justify-center min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/app_finance.png')" }}
  >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
  </div>
);

export const AppLayout = () => {
  const { currentUser, loading: authLoading, selectedBaseId, logout } = useAuth();
  const { bases: allBases, loading: basesLoading } = useStores();
  const navigate = useNavigate();

  const handleLogoutAndRedirect = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const basesParaUsuario = useMemo(() => {
    if (!currentUser || !allBases) return [];
    if (currentUser.isAdmin) {
      return allBases;
    }
    return allBases.filter(
      (base) =>
        base.ativo &&
        ((base.authorizedUIDs && base.authorizedUIDs[currentUser.uid]) ||
          base.createdBy === currentUser.uid)
    );
  }, [allBases, currentUser]);

  if (authLoading || (currentUser && basesLoading)) {
    return <FullScreenLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && !selectedBaseId) {
    const isAdmin = !!currentUser.isAdmin;
    const hasBases = basesParaUsuario.length > 0;

    if (isAdmin || hasBases) {
      return (
        <>
          <FullScreenLoader />
          <AccessSelectionModal
            isOpen={true}
            onClose={handleLogoutAndRedirect}
            bases={basesParaUsuario}
            isAdmin={isAdmin}
          />
        </>
      );
    } else {
       handleLogoutAndRedirect();
       return null; 
    }
  }

  return <Outlet />;
};