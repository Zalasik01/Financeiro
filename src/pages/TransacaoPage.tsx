import React from 'react'; // Removido useState e Label se não forem mais usados diretamente aqui
import { useClientesFornecedores } from '@/hooks/useClientesFornecedores';
import { useFinance } from "@/hooks/useFinance";
import { TransactionManager } from "@/components/TransactionManager"; // Assumindo que este componente existe e está configurado
import { Transaction } from '@/types/finance'; // Supondo que você tenha um tipo Transaction

const TransacaoPage: React.FC = () => {
  const {
    categories,
    transactions, // Adicionado para passar ao TransactionManager
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const { clientesFornecedores, carregando: carregandoCF } = useClientesFornecedores();

  // Wrapper para addTransaction para incluir o personId
  const handleAddTransactionWithPerson = async (transactionData: Omit<Transaction, 'id'>) => {
    // Adapte a interface de transactionData conforme o que TransactionManager envia
    // e o que addTransaction espera.
    // O personId agora é adicionado pelo TransactionForm
    // @ts-ignore 
    return addTransaction(transactionData);
  };

  // Wrapper para updateTransaction para incluir o personId
  const handleUpdateTransactionWithPerson = async (id: string, transactionData: Partial<Omit<Transaction, 'id'>>) => {
    // O personId agora é adicionado pelo TransactionForm
    // @ts-ignore 
    return updateTransaction(id, transactionData);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Transações</h1>

      <TransactionManager
        transactions={transactions}
        categories={categories}
        onAddTransaction={handleAddTransactionWithPerson}
        onUpdateTransaction={handleUpdateTransactionWithPerson}
        onDeleteTransaction={deleteTransaction}
        clientesFornecedores={clientesFornecedores} // Passar para o TransactionManager
        carregandoCF={carregandoCF} // Passar para o TransactionManager
        // **IMPORTANTE**: Você precisará modificar o TransactionManager internamente
        // para que ele renderize os campos na ordem:
        // Loja > Cliente (se ele tiver um seletor interno) > Descrição > Tipo > Categoria > Valor > Desconto > Data
        // E também para que ele aceite e utilize o `personId` que estamos passando.
      />
    </div>
  );
};

export default TransacaoPage;
