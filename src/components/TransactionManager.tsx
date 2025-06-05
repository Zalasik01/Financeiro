
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, Category } from '@/types/finance';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { useStores } from '@/hooks/useStores'; // Importar useStores

interface TransactionManagerProps {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction> | null) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionManager = ({
  transactions,
  categories,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}: TransactionManagerProps) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { stores } = useStores(); // Obter a lista de lojas

  const handleUpdateTransaction = (id: string, transaction: Partial<Transaction> | null) => {
    onUpdateTransaction(id, transaction);
    setEditingTransaction(null);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💳 Gerenciar Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <TransactionForm 
          categories={categories} 
          onAddTransaction={onAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          editingTransaction={editingTransaction}
        />

        <TransactionList
          transactions={transactions}
          onDeleteTransaction={onDeleteTransaction}
          onEditTransaction={setEditingTransaction}
          stores={stores} // Passar a lista de lojas
        />
      </CardContent>
    </Card>
  );
};
