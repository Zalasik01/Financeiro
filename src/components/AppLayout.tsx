import { useAuth } from "@/hooks/useAuth";
import { Outlet, Navigate } from "react-router-dom";
import { AccessSelectionModal } from "@/components/AccessSelectionModal";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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
  const { currentUser, loading, selectedBaseId, logout, hasJustLoggedInRef } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (currentUser && !selectedBaseId && hasJustLoggedInRef.current) {
      setIsModalOpen(true);
      hasJustLoggedInRef.current = false;
    }
  }, [currentUser, selectedBaseId, loading, hasJustLoggedInRef]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    logout();
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (selectedBaseId) {
    return <Outlet />;
  }
  
  return (
    <>
      <FullScreenLoader />
      <AccessSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isAdmin={!!currentUser?.isAdmin}
      />
    </>
  );
};