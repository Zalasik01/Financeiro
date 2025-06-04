
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialSummary } from '@/types/finance';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
}

export const FinancialSummaryCards = ({ summary }: FinancialSummaryCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            Receitas
          </CardTitle>
          <span className="text-2xl">💰</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </div>
          <p className="text-xs text-green-500 mt-1">
            Total de entradas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300 animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700">
            Despesas
          </CardTitle>
          <span className="text-2xl">💸</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <p className="text-xs text-red-500 mt-1">
            Total de saídas
          </p>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${
        summary.balance >= 0 
          ? 'from-blue-50 to-blue-100 border-blue-200' 
          : 'from-red-50 to-red-100 border-red-200'
      } hover:shadow-lg transition-all duration-300 animate-fade-in`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${
            summary.balance >= 0 ? 'text-blue-700' : 'text-red-700'
          }`}>
            Saldo
          </CardTitle>
          <span className="text-2xl">
            {summary.balance >= 0 ? '📈' : '📉'}
          </span>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            {formatCurrency(summary.balance)}
          </div>
          <p className={`text-xs mt-1 ${
            summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'
          }`}>
            {summary.balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">
            Transações
          </CardTitle>
          <span className="text-2xl">📊</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {summary.transactionCount}
          </div>
          <p className="text-xs text-purple-500 mt-1">
            Total de lançamentos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
