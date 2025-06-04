
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

interface ExportReportsProps {
  transactions: Transaction[];
  onExportData: () => void;
}

export const ExportReports = ({ transactions, onExportData }: ExportReportsProps) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const csvData = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString('pt-BR'),
      transaction.description,
      transaction.category?.name || 'Sem categoria',
      transaction.type === 'income' ? 'Receita' : 'Despesa',
      transaction.amount.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório CSV exportado com sucesso!",
    });
  };

  const exportSummaryReport = () => {
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpenses += Math.abs(transaction.amount);
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0 });

    const balance = summary.totalIncome - summary.totalExpenses;

    const reportContent = `
RELATÓRIO FINANCEIRO
====================

Período: ${new Date().toLocaleDateString('pt-BR')}
Total de Transações: ${transactions.length}

RESUMO FINANCEIRO:
- Total de Receitas: R$ ${summary.totalIncome.toFixed(2).replace('.', ',')}
- Total de Despesas: R$ ${summary.totalExpenses.toFixed(2).replace('.', ',')}
- Saldo: R$ ${balance.toFixed(2).replace('.', ',')}

TRANSAÇÕES POR CATEGORIA:
${Object.entries(
  transactions.reduce((acc, t) => {
    const cat = t.category?.name || 'Sem categoria';
    if (!acc[cat]) acc[cat] = { income: 0, expenses: 0, count: 0 };
    if (t.type === 'income') acc[cat].income += t.amount;
    else acc[cat].expenses += Math.abs(t.amount);
    acc[cat].count++;
    return acc;
  }, {} as Record<string, { income: number; expenses: number; count: number }>)
).map(([cat, data]) => 
  `- ${cat}: ${data.count} transações | Receitas: R$ ${data.income.toFixed(2).replace('.', ',')} | Despesas: R$ ${data.expenses.toFixed(2).replace('.', ',')}`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório resumo exportado com sucesso!",
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 Exportar Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm">Exportar CSV</span>
          </Button>
          
          <Button 
            onClick={exportSummaryReport}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm">Relatório Resumo</span>
          </Button>
          
          <Button 
            onClick={onExportData}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20"
          >
            <span className="text-2xl">💾</span>
            <span className="text-sm">Backup Completo</span>
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📝 Tipos de Relatório:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>CSV:</strong> Planilha com todas as transações para análise externa</li>
            <li><strong>Resumo:</strong> Relatório em texto com totais e estatísticas</li>
            <li><strong>Backup:</strong> Arquivo JSON com todos os dados para restauração</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
