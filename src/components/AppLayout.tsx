import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogoutAndRedirect = async () => {
    setIsModalOpen(false);
    await logout();
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

  useEffect(() => {
    if (authLoading || (currentUser && basesLoading)) {
      return;
    }

    if (currentUser && !selectedBaseId) {
      const isAdmin = !!currentUser.isAdmin;
      const hasBases = basesParaUsuario.length > 0;
      if (isAdmin || hasBases) {
        setIsModalOpen(true);
      } else {
        handleLogoutAndRedirect();
      }
    } else {
      setIsModalOpen(false);
    }
  }, [currentUser, selectedBaseId, authLoading, basesLoading, basesParaUsuario]);

  if (authLoading || (currentUser && basesLoading && !selectedBaseId)) {
    return <FullScreenLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Outlet />
      <AccessSelectionModal
        isOpen={isModalOpen}
        onClose={handleLogoutAndRedirect}
        bases={basesParaUsuario}
        isAdmin={!!currentUser?.isAdmin}
      />
    </>
  );
};