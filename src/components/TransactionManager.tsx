import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, Category } from "@/types/finance";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"; // Importar tipo
import { useStores } from "@/hooks/useStores"; // Importar useStores

interface TransactionManagerProps {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => void;
  onUpdateTransaction: (
    id: string,
    transaction: Partial<Transaction> | null
  ) => void;
  onDeleteTransaction: (id: string) => void;
  clientesFornecedores: ClienteFornecedor[];
  carregandoCF: boolean;
  tipoInicial?: "Receita" | "Despesa";
}

interface LastUsedTransactionFields {
  type?: "Receita" | "Despesa";
  storeId?: string;
  categoryId?: string;
}

export const TransactionManager = ({
  transactions,
  categories,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  clientesFornecedores,
  carregandoCF,
  tipoInicial,
}: TransactionManagerProps) => {
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [lastUsedFields, setLastUsedFields] =
    useState<LastUsedTransactionFields | null>(null);
  const { stores } = useStores(); // Obter a lista de lojas

  const handleUpdateTransaction = (
    id: string,
    transaction: Partial<Transaction> | null
  ) => {
    onUpdateTransaction(id, transaction);
    setEditingTransaction(null);
  };

  const handleAddTransaction = (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => {
    onAddTransaction(transaction); // Chama a prop original
    // Atualiza os campos da última transação usada
    setLastUsedFields({
      type: transaction.type,
      storeId: transaction.storeId,
      categoryId: transaction.categoryId,
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Gerenciar Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <TransactionForm
          categories={categories}
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          editingTransaction={editingTransaction}
          lastUsedFields={tipoInicial ? { ...lastUsedFields, type: tipoInicial } : lastUsedFields}
          clientesFornecedores={clientesFornecedores}
          carregandoCF={carregandoCF}
        />

        <TransactionList
          transactions={transactions}
          onDeleteTransaction={onDeleteTransaction}
          onEditTransaction={setEditingTransaction}
          stores={stores} // Passar a lista de lojas
          clientesFornecedores={clientesFornecedores} // Adicionar esta linha
        />
      </CardContent>
    </Card>
  );
};
