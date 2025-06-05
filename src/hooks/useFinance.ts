import { useState, useMemo, useEffect } from "react";
import { Category, Transaction, FinancialSummary } from "@/types/finance";


// Dados iniciais de exemplo para categorias
const defaultCategories: Category[] = [
  { id: "1", name: "Venda de Roupas", type: "income", color: "#10B981", icon: "👚" },
  { id: "2", name: "Venda de Acessórios", type: "income", color: "#3B82F6", icon: "👜" },
  { id: "3", name: "Serviços (Ajustes, etc.)", type: "income", color: "#8B5CF6", icon: "🧵" },
  {
    id: "4",
    name: "Custo de Mercadoria Vendida (CMV)",
    type: "expense",
    color: "#F59E0B",
    icon: "🧾",
  },
  {
    id: "5",
    name: "Aluguel da Loja",
    type: "expense",
    color: "#EF4444",
    icon: "🏠",
  },
  { id: "6", name: "Salários e Encargos", type: "expense", color: "#D97706", icon: "👥" },
  { id: "7", name: "Marketing e Publicidade", type: "expense", color: "#0EA5E9", icon: "📢" },
  { id: "8", name: "Contas (Água, Luz, Internet)", type: "expense", color: "#6366F1", icon: "💡" },
  { id: "9", name: "Impostos e Taxas", type: "expense", color: "#EC4899", icon: "📜" },
  { id: "10", name: "Manutenção e Reparos", type: "expense", color: "#F472B6", icon: "🛠️" },
  { id: "11", name: "Despesas com Embalagens", type: "expense", color: "#A78BFA", icon: "🛍️" },
  { id: "12", name: "Outras Despesas Operacionais", type: "expense", color: "#78716C", icon: "⚙️" },
];

export const useFinance = () => {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedTransactions = localStorage.getItem("financeTransactions");
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions) as Transaction[];
        // É importante converter as strings de data de volta para objetos Date
        return parsedTransactions.map(t => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
        }));
      } catch (error) {
        console.error("Erro ao parsear transações do localStorage:", error);
        return [];
      }
    }
    return [];
  });

  // Adicionar uma nova categoria
  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
    };
    setCategories(prevCategories => [...prevCategories, newCategory]);
    return newCategory;
  };

  // Atualizar uma categoria existente
  const updateCategory = (id: string, categoryData: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, ...categoryData } : category
      )
    );
  };

  // Deletar uma categoria
  const deleteCategory = (id: string) => {
    setCategories(prevCategories => prevCategories.filter((cat) => cat.id !== id));
  };

  // Adicionar uma nova transação
  const addTransaction = (
    transaction: Omit<Transaction, "id" | "createdAt" | "category"> // category será buscado aqui
  ) => {
    const category = categories.find(
      (cat) => cat.id === transaction.categoryId
    );
    if (!category) {
      console.error("Categoria não encontrada para a transação:", transaction);
      // Poderia lançar um erro ou retornar null/undefined se a categoria é obrigatória
    }
    const newTransaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID mais robusto
      category,
      createdAt: new Date(),
    };
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
    return newTransaction;
  };

  // Atualizar uma transação existente
  const updateTransaction = (
    id: string,
    transactionData: Partial<Transaction> | null
  ) => {
    if (transactionData === null) {
      return; // Cancela a edição
    }

    setTransactions((prev) =>
      prev.map((transaction) => {
        if (transaction.id !== id) return transaction;

        const updatedTransaction = { ...transaction, ...transactionData };

        // Atualiza a categoria se categoryId foi alterado
        if (
          transactionData.categoryId &&
          transactionData.categoryId !== transaction.categoryId
        ) {
          updatedTransaction.category = categories.find(
            (cat) => cat.id === transactionData.categoryId
          );
        }

        return updatedTransaction;
      })
    );
  };

  // Deletar uma transação
  const deleteTransaction = (id: string) => {
    setTransactions(prevTransactions => prevTransactions.filter((t) => t.id !== id));
  };

  // Calcular o resumo financeiro
  const summary = useMemo((): FinancialSummary => {
    // console.log("Calculando summary. Transações atuais:", transactions); 

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (transactions.length > 0) {
      // Ordena as transações por data para pegar a primeira e a última facilmente
      const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      startDate = new Date(sortedTransactions[0].date);
      endDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
    }

    const calculatedSummary = {
      totalIncome: income,
      totalExpenses: expense,
      balance: income - expense,
      transactionCount: transactions.length,
      startDate,
      endDate,
    };
    // console.log("Summary calculado:", calculatedSummary);
    return calculatedSummary;
  }, [transactions]);

  // Remover transações de uma data e loja específicas
  // Esta função será chamada após um fechamento de caixa que incluiu essas transações
  const removeTransactionsByDateAndStore = (dateToRemove: Date, storeId: string) => {
    console.log(`[useFinance] Tentando remover transações para data: ${dateToRemove.toISOString().split('T')[0]} e loja ID: ${storeId}`);
    setTransactions(prevTransactions =>
      {
        console.log("[useFinance] Transações ANTES da remoção:", JSON.parse(JSON.stringify(prevTransactions)));
        const transactionsToKeep = prevTransactions.filter(t => {
        // Se a transação não tiver storeId, ela nunca será removida por esta função específica de loja.
        if (t.storeId !== storeId) {
          return true;
        }
        const transactionDate = new Date(t.date);
        // Compara apenas ano, mês e dia
        const shouldRemove = 
          transactionDate.getFullYear() === dateToRemove.getFullYear() &&
          transactionDate.getMonth() === dateToRemove.getMonth() &&
          transactionDate.getDate() === dateToRemove.getDate() &&
          t.storeId === storeId;

        return !shouldRemove; // Manter se NÃO deve remover
      });

      const transactionsRemoved = prevTransactions.filter(t => !transactionsToKeep.includes(t));
      console.log("[useFinance] Transações A SEREM REMOVIDAS:", JSON.parse(JSON.stringify(transactionsRemoved)));
      console.log("[useFinance] Transações APÓS tentativa de remoção (a serem mantidas):", JSON.parse(JSON.stringify(transactionsToKeep)));
      
      return transactionsToKeep;
    }
    );
  };

  // Exportar dados para backup
  const exportData = () => {
    const data = {
      categories,
      transactions,
      exportDate: new Date(),
    };

    // Criar um arquivo para download
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finances_backup_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return data;
  };

  const transactionsWithCategories = useMemo(() => {
    return transactions.map((tx) => ({
      ...tx,
      category: categories.find((cat) => cat.id === tx.categoryId),
    }));
  }, [transactions, categories]);

  // Efeito para salvar transações no localStorage sempre que elas mudarem
  useEffect(() => {
    localStorage.setItem("financeTransactions", JSON.stringify(transactions));
  }, [transactions]);

  return {
    categories,
    transactions: transactionsWithCategories,
    summary,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    removeTransactionsByDateAndStore,
    exportData,
  };
};
