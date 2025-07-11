import {
  selectedBase,
  userSession,
  type StoredBaseInfo,
  type StoredUserSession,
} from "@/utils/storage";
import React from "react";

// Hook para obter informações da organização atual
export const useOrganizationInfo = () => {
  const [baseInfo, setBaseInfo] = React.useState<StoredBaseInfo | null>(null);
  const [sessionInfo, setSessionInfo] =
    React.useState<StoredUserSession | null>(null);

  React.useEffect(() => {
    const updateInfo = () => {
      setBaseInfo(selectedBase.get());
      setSessionInfo(userSession.get());
    };

    // Atualizar inicialmente
    updateInfo();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("finance_app_")) {
        updateInfo();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Polling para mudanças na mesma aba (localStorage não dispara evento na mesma aba)
    const interval = setInterval(updateInfo, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return {
    baseInfo,
    sessionInfo,
    hasValidSession: !!(baseInfo && sessionInfo),
  };
};
