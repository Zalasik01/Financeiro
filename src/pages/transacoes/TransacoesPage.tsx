import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClientesFornecedores } from '@/hooks/useClientesFornecedores';
import { useFinance } from "@/hooks/useFinance";
import { TransactionManager } from "@/components/TransactionManager";
import { Transaction } from '@/types/finance';

const TransacoesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [tipoInicial, setTipoInicial] = useState<"Receita" | "Despesa" | undefined>();
  
  const {
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const { clientesFornecedores, carregando: carregandoCF } = useClientesFornecedores();

  useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo === 'receita') {
      setTipoInicial('Receita');
    } else if (tipo === 'despesa') {
      setTipoInicial('Despesa');
    }
  }, [searchParams]);

  const handleAddTransactionWithPerson = async (transactionData: Omit<Transaction, 'id'>) => {
    return addTransaction(transactionData);
  };

  const handleUpdateTransactionWithPerson = async (id: string, transactionData: Partial<Omit<Transaction, 'id'>>) => {
    return updateTransaction(id, transactionData);
  };

  return (
    <div className="w-[90%] mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Transações</h1>
      <TransactionManager
        transactions={transactions}
        categories={categories}
        onAddTransaction={handleAddTransactionWithPerson}
        onUpdateTransaction={handleUpdateTransactionWithPerson}
        onDeleteTransaction={deleteTransaction}
        clientesFornecedores={clientesFornecedores}
        carregandoCF={carregandoCF}
        tipoInicial={tipoInicial}
      />
    </div>
  );
};

export default TransacoesPage;
