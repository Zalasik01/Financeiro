import { useFinance } from "@/hooks/useFinance";
import { useStores } from "@/hooks/useStores.simple.v2";
import React from "react";

const Footer: React.FC = () => {
  const { summary } = useFinance();
  const { stores, closings } = useStores();

  // Acessar a variável de ambiente injetada pelo Vite
  const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP || "N/A";

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Sistema completo de gestão financeira</p>
          <p className="text-sm mt-2">
            <strong>{summary.transactionCount}</strong> Transações •{" "}
            <strong>{stores.length}</strong> Lojas cadastradas •{" "}
            <strong>{closings.length}</strong> Fechamentos registrados
          </p>
          <p className="text-xs mt-4">Versão: {buildTimestamp}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
