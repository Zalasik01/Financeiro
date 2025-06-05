import React from "react";
import { useFinance } from "@/hooks/useFinance";
import { TransactionManager } from "@/components/TransactionManager";

const TransacaoPage: React.FC = () => {
  const {
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Transações</h1>
      <TransactionManager
        transactions={transactions}
        categories={categories}
        onAddTransaction={addTransaction}
        onUpdateTransaction={updateTransaction}
        onDeleteTransaction={deleteTransaction}
      />
    </div>
  );
};

export default TransacaoPage;
