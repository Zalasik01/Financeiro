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
  clientesFornecedores: ClienteFornecedor[]; // Adicionar prop
  carregandoCF: boolean; // Adicionar prop
}

interface LastUsedTransactionFields {
  type?: "income" | "expense";
  storeId?: string;
  categoryId?: string;
}

export const TransactionManager = ({
  transactions,
  categories,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  clientesFornecedores, // Receber prop
  carregandoCF, // Receber prop
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
          💳 Gerenciar Transações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <TransactionForm
          categories={categories}
          onAddTransaction={handleAddTransaction} // Usa o novo handler
          onUpdateTransaction={handleUpdateTransaction}
          editingTransaction={editingTransaction}
          lastUsedFields={lastUsedFields} // Passa os campos para o formulário
          clientesFornecedores={clientesFornecedores} // Passar para o TransactionForm
          carregandoCF={carregandoCF} // Passar para o TransactionForm
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
