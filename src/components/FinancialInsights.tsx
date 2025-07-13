import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  StoreRanking as StoreRankingType,
  Store,
  StoreClosing,
} from "@/types/store";
import { formatCurrency } from "@/utils/formatters";
import { Chart as ChartJS, registerables } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { Transaction } from "@/types/finance";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

ChartJS.register(...registerables);

interface FinancialInsightsProps {
  stores: Store[];
  closings: StoreClosing[];
  transactions: Transaction[];
}

export const FinancialInsights = ({
  stores,
  closings,
  transactions,
}: FinancialInsightsProps) => {
  const [timeRange, setTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // Calcula o período com base no timeRange
  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    return { startDate, endDate: today };
  };

  const { startDate, endDate } = getDateRange();

  // Filtra os fechamentos pelo período selecionado
  const filteredClosings = closings.filter(
    (closing) =>
      new Date(closing.closingDate) >= startDate &&
      new Date(closing.closingDate) <= endDate
  );

  const filteredTransactions = transactions.filter(
    (tx) => new Date(tx.date) >= startDate && new Date(tx.date) <= endDate
  );

  // Agrupa fechamentos por loja
  const closingsByStore = stores
    .map((store) => {
      const storeClosings = filteredClosings.filter(
        (closing) => closing.storeId === store.id
      );
      return {
        store,
        closings: storeClosings,
        totalRevenue: storeClosings.reduce(
          (sum, closing) => sum + closing.totalEntradas,
          0
        ),
        totalExpenses: storeClosings.reduce(
          (sum, closing) => sum + closing.totalSaidas,
          0
        ),
        netResult: storeClosings.reduce(
          (sum, closing) => sum + closing.netResult,
          0
        ),
      };
    })
    .filter((item) => item.closings.length > 0);

  // Ordena por receita total
  closingsByStore.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Calcula eficiência financeira (receita por fechamento)
  const financialEfficiency = closingsByStore.map((store) => ({
    store: store.store,
    closingsCount: store.closings.length,
    revenuePerClosing:
      store.closings.length > 0
        ? store.totalRevenue / store.closings.length
        : 0,
    costPerRevenue:
      store.totalRevenue > 0
        ? (store.totalExpenses / store.totalRevenue) * 100
        : 0,
    profitMargin:
      store.totalRevenue > 0 ? (store.netResult / store.totalRevenue) * 100 : 0,
  }));

  // Dados para os gráficos
  const revenueChartData = {
    labels: closingsByStore
      .slice(0, 5)
      .map((item) => item.store.nickname || item.store.name),
    datasets: [
      {
        label: "Receitas",
        data: closingsByStore.slice(0, 5).map((item) => item.totalRevenue),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
      {
        label: "Despesas",
        data: closingsByStore.slice(0, 5).map((item) => item.totalExpenses),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
      },
    ],
  };

  // Calcula tendências para transações
  const today = new Date();
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30DaysTransactions = transactions.filter(
    (tx) => new Date(tx.date) >= last30Days
  );

  const income30Days = last30DaysTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense30Days = last30DaysTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Comparação com os 30 dias anteriores
  const previous30Days = new Date(
    last30Days.getTime() - 30 * 24 * 60 * 60 * 1000
  );
  const previous30DaysTransactions = transactions.filter(
    (tx) =>
      new Date(tx.date) >= previous30Days && new Date(tx.date) < last30Days
  );

  const incomePrevious30Days = previous30DaysTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expensePrevious30Days = previous30DaysTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const incomeChange =
    incomePrevious30Days > 0
      ? ((income30Days - incomePrevious30Days) / incomePrevious30Days) * 100
      : 100;

  const expenseChange =
    expensePrevious30Days > 0
      ? ((expense30Days - expensePrevious30Days) / expensePrevious30Days) * 100
      : 100;

  // Categorias mais usadas
  const topCategories = [...last30DaysTransactions]
    .reduce(
      (
        acc: { id: string; name: string; icon: string; amount: number }[],
        tx
      ) => {
        if (!tx.category) return acc;

        const existing = acc.find((c) => c.id === tx.categoryId);
        if (existing) {
          existing.amount += Math.abs(tx.amount);
        } else {
          acc.push({
            id: tx.categoryId,
            name: tx.category.name,
            icon: tx.category.icon,
            amount: Math.abs(tx.amount),
          });
        }
        return acc;
      },
      []
    )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const periodLabels = {
    week: "última semana",
    month: "último mês",
    quarter: "último trimestre",
    year: "último ano",
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📈 Insights Financeiros
          </span>
          <Select
            value={timeRange}
            onValueChange={(value: "week" | "month" | "quarter" | "year") =>
              setTimeRange(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estatísticas de performance */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Performance das Lojas ({periodLabels[timeRange]})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Loja</th>
                    <th className="text-right py-2">Receita/Fechamento</th>
                    <th className="text-right py-2">Custo/Receita</th>
                    <th className="text-right py-2">Margem de Lucro</th>
                    <th className="text-right py-2">Fechamentos</th>
                  </tr>
                </thead>
                <tbody>
                  {financialEfficiency.length > 0 ? (
                    financialEfficiency.map((item) => (
                      <tr
                        key={item.store.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span>{item.store.icon || "🏪"}</span>
                            <span className="font-medium">
                              {item.store.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-2">
                          <span className="font-medium text-green-600">
                            {formatCurrency(item.revenuePerClosing)}
                          </span>
                        </td>
                        <td className="text-right py-2">
                          <Badge
                            variant={
                              item.costPerRevenue < 50
                                ? "default"
                                : item.costPerRevenue < 80
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {item.costPerRevenue.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right py-2">
                          <span
                            className={`font-medium ${
                              item.profitMargin > 20
                                ? "text-green-600"
                                : item.profitMargin > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-2">
                          {item.closingsCount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-4 text-gray-500"
                      >
                        Nenhum dado de fechamento disponível para este período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de Receitas x Despesas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Top 5 - Receitas vs Despesas</h4>
              <div className="h-64">
                {closingsByStore.length > 0 ? (
                  <Bar
                    data={revenueChartData}
                    options={{ maintainAspectRatio: false }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados para exibição
                  </div>
                )}
              </div>
            </div>

            {/* Finanças Pessoais */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3">
                Tendências nas Finanças Pessoais
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-sm text-green-700">
                      Receitas (30 dias)
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-green-600 text-lg">
                        {formatCurrency(income30Days)}
                      </div>
                      <Badge
                        variant={incomeChange >= 0 ? "default" : "destructive"}
                      >
                        {incomeChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(Math.round(incomeChange))}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-sm text-red-700">
                      Despesas (30 dias)
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-red-600 text-lg">
                        {formatCurrency(expense30Days)}
                      </div>
                      <Badge
                        variant={expenseChange <= 0 ? "default" : "destructive"}
                      >
                        {expenseChange <= 0 ? "↓" : "↑"}{" "}
                        {Math.abs(Math.round(expenseChange))}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Top Categorias */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">
                    Top Categorias (30 dias)
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {topCategories.length > 0 ? (
                      topCategories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <span>{cat.icon}</span> {cat.name} -{" "}
                          {formatCurrency(cat.amount)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        Nenhuma transação no período
                      </span>
                    )}
                  </div>
                </div>

                {/* Sugestão */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
                  <h5 className="text-sm font-medium text-blue-700">
                    Sugestão Financeira
                  </h5>
                  <p className="text-sm text-gray-700 mt-1">
                    {expense30Days > income30Days
                      ? "⚠️ Suas despesas estão superando as receitas. Considere reduzir gastos não essenciais."
                      : income30Days > expense30Days * 2
                      ? "✅ Excelente balanço financeiro! Considere investir o excedente."
                      : "👍 Seu balanço está positivo. Continue controlando os gastos."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
