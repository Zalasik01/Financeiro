import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  Legend,
} from "recharts";
import { DREData, Store } from "@/types/store";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface DREReportProps {
  onGenerateDRE: (startDate: Date, endDate: Date, storeId?: string) => DREData;
  stores: Store[];
}

export const DREReport = ({ onGenerateDRE, stores }: DREReportProps) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [monthYear, setMonthYear] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [prevMonthYear, setPrevMonthYear] = useState({
    month: new Date().getMonth(),
    year:
      new Date().getMonth() === 0
        ? new Date().getFullYear() - 1
        : new Date().getFullYear(),
  });

  const [dreData, setDreData] = useState<DREData | null>(null);
  type MonthOverMonthStoreData = {
    store: Store;
    totalReceitas: number;
    totalDespesas: number;
    resultadoLiquido: number;
    prevRevenue: number;
    prevExpenses: number;
    prevResult: number;
    revenueChange: number;
    expensesChange: number;
    resultChange: number;
  };

  const [monthOverMonthData, setMonthOverMonthData] = useState<
    MonthOverMonthStoreData[]
  >([]);

  const handleGenerateDRE = () => {
    const startDate = new Date(monthYear.year, monthYear.month - 1, 1);
    const endDate = new Date(monthYear.year, monthYear.month, 0); // último dia do mês
    const data = onGenerateDRE(
      startDate,
      endDate,
      selectedStoreId || undefined
    );
    setDreData(data);

    // Gerar dados do mês anterior também para comparação
    const prevStartDate = new Date(
      prevMonthYear.year,
      prevMonthYear.month - 1,
      1
    );
    const prevEndDate = new Date(prevMonthYear.year, prevMonthYear.month, 0);
    const prevData = onGenerateDRE(
      prevStartDate,
      prevEndDate,
      selectedStoreId || undefined
    );

    // Calcular diferenças M/M
    const momData = data.stores.map((store) => {
      const prevStore = prevData.stores.find(
        (ps) => ps.store.id === store.store.id
      );
      const prevRevenue = prevStore?.totalReceitas || 0;
      const prevExpenses = prevStore?.totalDespesas || 0;
      const prevResult = prevStore?.resultadoLiquido || 0;

      const revenueChange =
        prevRevenue > 0
          ? ((store.totalReceitas - prevRevenue) / prevRevenue) * 100
          : 100;
      const expensesChange =
        prevExpenses > 0
          ? ((store.totalDespesas - prevExpenses) / prevExpenses) * 100
          : 100;
      const resultChange =
        prevResult !== 0
          ? ((store.resultadoLiquido - prevResult) / Math.abs(prevResult)) * 100
          : 100;

      return {
        ...store,
        prevRevenue,
        prevExpenses,
        prevResult,
        revenueChange,
        expensesChange,
        resultChange,
      };
    });

    setMonthOverMonthData(momData);
  };

  useEffect(() => {
    // Atualiza o mês anterior quando o mês atual muda
    let prevMonth = monthYear.month - 1;
    let prevYear = monthYear.year;

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    setPrevMonthYear({ month: prevMonth, year: prevYear });
  }, [monthYear]);

  useEffect(() => {
    const defaultStore = stores.find((s) => s.isDefault);
    if (defaultStore && !selectedStoreId) {
      setSelectedStoreId(defaultStore.id);
    } else if (stores.length === 1 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    } else if (
      !defaultStore &&
      stores.length > 1 &&
      selectedStoreId &&
      !stores.find((s) => s.id === selectedStoreId)
    ) {
      setSelectedStoreId(""); // Limpa se a selecionada não existe e não há padrão
    }
  }, [stores, selectedStoreId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const chartConfig = {
    receitas: {
      label: "Receitas",
      color: "#10B981",
    },
    despesas: {
      label: "Despesas",
      color: "#EF4444",
    },
    resultado: {
      label: "Resultado",
      color: "#3B82F6",
    },
    prevReceitas: {
      label: "Receitas (Mês Anterior)",
      color: "#34D399",
    },
    prevDespesas: {
      label: "Despesas (Mês Anterior)",
      color: "#F87171",
    },
    prevResultado: {
      label: "Resultado (Mês Anterior)",
      color: "#60A5FA",
    },
  };

  const barChartData =
    dreData?.stores.map((store) => ({
      name: store.store.nickname || store.store.name,
      receitas: store.totalReceitas,
      despesas: store.totalDespesas,
      resultado: store.resultadoLiquido,
    })) || [];

  const pieChartData =
    dreData?.stores.map((store) => ({
      name: store.store.nickname || store.store.name,
      value: store.totalReceitas,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    })) || [];

  const momChartData = monthOverMonthData.map((store) => ({
    name: store.store.nickname || store.store.name,
    revenueChange: parseFloat(store.revenueChange.toFixed(2)),
    expensesChange: parseFloat(store.expensesChange.toFixed(2)),
    resultChange: parseFloat(store.resultChange.toFixed(2)),
  }));

  const COLORS = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
  ];

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 DRE - Demonstrativo de Resultado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label>Loja</Label>
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as lojas" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.icon || "🏪"} {store.name}{" "}
                    {store.nickname && `(${store.nickname})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Período</Label>
            <div className="flex gap-2">
              <Select
                value={monthYear.month.toString()}
                onValueChange={(value) =>
                  setMonthYear((prev) => ({ ...prev, month: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={monthYear.year.toString()}
                onValueChange={(value) =>
                  setMonthYear((prev) => ({ ...prev, year: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - 2 + i
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={handleGenerateDRE} className="w-full">
              Gerar DRE
            </Button>
          </div>
        </div>

        {dreData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Total de Receitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dreData.consolidated.totalReceitas)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">
                    Total de Despesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(dreData.consolidated.totalDespesas)}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`bg-gradient-to-br ${
                  dreData.consolidated.resultadoLiquido >= 0
                    ? "from-blue-50 to-blue-100 border-blue-200"
                    : "from-red-50 to-red-100 border-red-200"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-sm font-medium ${
                      dreData.consolidated.resultadoLiquido >= 0
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    Resultado Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      dreData.consolidated.resultadoLiquido >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(dreData.consolidated.resultadoLiquido)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resultado por Loja</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="receitas" fill="var(--color-receitas)" />
                        <Bar dataKey="despesas" fill="var(--color-despesas)" />
                        <Bar
                          dataKey="resultado"
                          fill="var(--color-resultado)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Month over Month Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Variação M/M</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={momChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Bar
                          dataKey="revenueChange"
                          name="Receitas"
                          fill="#10B981"
                        />
                        <Bar
                          dataKey="expensesChange"
                          name="Despesas"
                          fill="#EF4444"
                        />
                        <Bar
                          dataKey="resultChange"
                          name="Resultado"
                          fill="#3B82F6"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Pie Chart + Line Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receitas por Loja</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Trend Chart with Month/Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Comparativo Mês Anterior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-center text-gray-500 mb-2">
                    {months[prevMonthYear.month - 1]} vs.{" "}
                    {months[monthYear.month - 1]} de {monthYear.year}
                  </div>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthOverMonthData.map((store) => ({
                          name: store.store.nickname || store.store.name,
                          atual: store.totalReceitas,
                          anterior: store.prevRevenue,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="atual"
                          name="Mês Atual"
                          stroke="#3B82F6"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="anterior"
                          name="Mês Anterior"
                          stroke="#9CA3AF"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento por Loja</CardTitle>
                <p className="text-sm text-gray-600">
                  Período: {dreData.period}
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Loja</th>
                        <th className="text-right p-2">Receitas</th>
                        <th className="text-right p-2">Despesas</th>
                        <th className="text-right p-2">Resultado</th>
                        <th className="text-center p-2">Variação M/M</th>
                        <th className="text-center p-2">Fechamentos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dreData.stores.map((storeData, index) => {
                        const momData = monthOverMonthData[index];
                        return (
                          <tr
                            key={storeData.store.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {storeData.store.icon || "🏪"}
                                </span>
                                <div>
                                  <div className="font-medium">
                                    {storeData.store.name}
                                  </div>
                                  {storeData.store.nickname && (
                                    <div className="text-sm text-gray-500">
                                      {storeData.store.nickname}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-right p-2 text-green-600 font-medium">
                              {formatCurrency(storeData.totalReceitas)}
                            </td>
                            <td className="text-right p-2 text-red-600 font-medium">
                              {formatCurrency(storeData.totalDespesas)}
                            </td>
                            <td
                              className={`text-right p-2 font-bold ${
                                storeData.resultadoLiquido >= 0
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(storeData.resultadoLiquido)}
                            </td>
                            <td className="text-center p-2">
                              {momData && (
                                <Badge
                                  variant={
                                    momData.resultChange > 0
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {momData.resultChange > 0 ? "↑" : "↓"}{" "}
                                  {Math.abs(Math.round(momData.resultChange))}%
                                </Badge>
                              )}
                            </td>
                            <td className="text-center p-2">
                              {storeData.closings.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-50 font-bold">
                        <td className="p-2">TOTAL CONSOLIDADO</td>
                        <td className="text-right p-2 text-green-600">
                          {formatCurrency(dreData.consolidated.totalReceitas)}
                        </td>
                        <td className="text-right p-2 text-red-600">
                          {formatCurrency(dreData.consolidated.totalDespesas)}
                        </td>
                        <td
                          className={`text-right p-2 ${
                            dreData.consolidated.resultadoLiquido >= 0
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            dreData.consolidated.resultadoLiquido
                          )}
                        </td>
                        <td className="text-center p-2">-</td>
                        <td className="text-center p-2">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!dreData && (
          <div className="text-center py-8 text-gray-500">
            <p>
              Selecione um período e clique em "Gerar DRE" para visualizar o
              relatório
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
