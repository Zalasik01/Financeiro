import { DREReport } from "@/components/DREReport";
import { ExportReports } from "@/components/ExportReports";
import { useFinance } from "@/hooks/useFinance";
import { useStores } from "@/hooks/useStores.simple";
import React from "react";

const DREPage: React.FC = () => {
  const { stores, generateDRE } = useStores();
  const { transactions, exportData } = useFinance();

  return (
    <div className="w-[90%] mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">DRE e Relatórios</h1>
      <div className="space-y-6">
        <DREReport onGenerateDRE={generateDRE} stores={stores} />
        <ExportReports transactions={transactions} onExportData={exportData} />
      </div>
    </div>
  );
};

export default DREPage;
