import { useFinance } from "@/hooks/useFinance";
import { useStores } from "@/hooks/useStores";
import { FinancialSummaryCards } from "@/components/FinancialSummaryCards";
import { FinancialCharts } from "@/components/FinancialCharts";
import { StoreRanking } from "@/components/StoreRanking";
import { FinancialInsights } from "@/components/FinancialInsights";

const Index = () => {
  const { categories, transactions, summary } = useFinance();

  const {
    stores,
    closings,
    storeRankings, // Usar diretamente o valor memoizado
  } = useStores();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                💰 Sistema de Gestão Financeira
              </h1>
              <p className="text-gray-600 mt-1">
                Controle completo das finanças pessoais e empresariais
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Summary Cards */}
        <FinancialSummaryCards summary={summary} />

        {/* Conteúdo da Visão Geral */}
        <div className="space-y-6">
          <FinancialCharts transactions={transactions} />

          {/* Store Rankings */}
          <StoreRanking rankings={storeRankings} />

          {/* Financial Insights */}
          <FinancialInsights
            stores={stores}
            closings={closings}
            transactions={transactions}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                📈 Última Receita
              </h3>
              {transactions.filter((t) => t.type === "income").length > 0 ? (
                <div>
                  <p className="text-green-600 font-bold text-xl">
                    +R${" "}
                    {transactions
                      .filter((t) => t.type === "income")
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )[0]
                      ?.amount.toFixed(2)
                      .replace(".", ",")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {
                      transactions.filter((t) => t.type === "income")[0]
                        ?.description
                    }
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma receita registrada</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                🏪 Lojas Cadastradas
              </h3>
              <p className="text-blue-600 font-bold text-xl">{stores.length}</p>
              <p className="text-sm text-gray-500">
                {closings.length} fechamentos registrados
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                🎯 Status Geral
              </h3>
              <p className="text-blue-600 font-bold text-xl">
                {summary.balance >= 0 ? "✅" : "❌"}{" "}
                {summary.balance >= 0 ? "Positivo" : "Negativo"}
              </p>
              <p className="text-sm text-gray-500">
                {summary.transactionCount} transações registradas
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
