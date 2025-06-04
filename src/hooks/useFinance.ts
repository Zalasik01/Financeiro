import { useState } from "react";
import { Category, Transaction, FinancialSummary } from "@/types/finance";

// Dados iniciais de exemplo para categorias
const defaultCategories: Category[] = [
  { id: "1", name: "Salário", type: "income", color: "#10B981", icon: "💰" },
  { id: "2", name: "Freelance", type: "income", color: "#3B82F6", icon: "💻" },
  { id: "3", name: "Aluguel", type: "expense", color: "#EF4444", icon: "🏠" },
  {
    id: "4",
    name: "Alimentação",
    type: "expense",
    color: "#F59E0B",
    icon: "🍔",
  },
  {
    id: "5",
    name: "Transporte",
    type: "expense",
    color: "#8B5CF6",
    icon: "🚗",
  },
];

export const useFinance = () => {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Adicionar uma nova categoria
  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
    };
    setCategories([...categories, newCategory]);
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
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  // Adicionar uma nova transação
  const addTransaction = (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => {
    const category = categories.find(
      (cat) => cat.id === transaction.categoryId
    );
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      category,
      createdAt: new Date(),
    };
    setTransactions([...transactions, newTransaction]);
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
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  // Calcular o resumo financeiro
  const calculateSummary = (): FinancialSummary => {
    console.log("Calculando summary. Transações atuais:", transactions); // Log das transações

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Encontrar a primeira e última data de transação
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (transactions.length > 0) {
      const dates = transactions.map((t) => new Date(t.date).getTime());
      startDate = new Date(Math.min(...dates));
      endDate = new Date(Math.max(...dates));
    }

    const calculatedSummary = {
      totalIncome: income, // Ajustado para totalIncome
      totalExpenses: expense, // Ajustado para totalExpenses
      balance: income - expense,
      transactionCount: transactions.length,
      startDate,
      endDate,
    };
    console.log("Summary calculado:", calculatedSummary); // Log do summary
    return calculatedSummary;
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

  const getTransactionsWithCategories = () => {
    return transactions.map((tx) => ({
      ...tx,
      category: categories.find((cat) => cat.id === tx.categoryId),
    }));
  };

  return {
    categories,
    transactions: getTransactionsWithCategories(),
    summary: calculateSummary(),
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    exportData,
  };
};
