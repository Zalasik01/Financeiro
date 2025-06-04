
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export const TransactionList = ({ transactions, onDeleteTransaction, onEditTransaction }: TransactionListProps) => {
  const { toast } = useToast();

  const handleDelete = (id: string, description: string) => {
    onDeleteTransaction(id);
    toast({
      title: "Transação removida",
      description: `"${description}" foi removida com sucesso.`,
    });
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700">Transações Recentes</h4>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma transação registrada</p>
        ) : (
          transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{transaction.category?.icon}</span>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {transaction.category?.name}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </span>
                      {transaction.discount && transaction.discount > 0 && (
                        <Badge variant="outline" className="text-xs text-red-500">
                          Desconto: {formatCurrency(transaction.discount)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-8 w-8"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(transaction.id, transaction.description)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
