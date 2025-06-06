import { useState, useMemo, useEffect } from "react";
import { Category, Transaction, FinancialSummary } from "@/types/finance";
import { useAuth } from "@/hooks/useAuth"; // Importar o hook de autenticação
import { useToast } from "@/hooks/use-toast"; // Importar o hook de toast
import { db } from "@/firebase"; // Importar a instância do RTDB
import {
  ref,
  onValue,
  push,
  set,
  remove,
  query,
  orderByChild,
  update,
  serverTimestamp,
  get,
  child,
  equalTo,
  orderByValue,
} from "firebase/database"; // Funções do RTDB

export const useFinance = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currentUser } = useAuth(); // Obter o usuário atual
  const { toast } = useToast(); // Inicializar o hook de toast

  // Carregar categorias do Realtime Database
  useEffect(() => {
    if (!currentUser) {
      setCategories([]); // Limpa as categorias se não houver usuário
      return;
    }
    const categoriesPath = `users/${currentUser.uid}/appCategories`;
    const categoriesNodeRef = ref(db, categoriesPath);
    // Para ordenar por nome no RTDB, você precisará configurar .indexOn: ["name"] nas regras do Firebase
    const categoriesQuery = query(categoriesNodeRef, orderByChild("name"));

    const unsubscribe = onValue(categoriesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriesList: Category[] = Object.keys(data).map((key) => {
          const categoryEntry = data[key];
          return {
            id: key,
            ...categoryEntry,
            createdAt: new Date(categoryEntry.createdAt),
          };
        });
        setCategories(categoriesList);
      } else {
        setCategories([]);
      }
    });

    return () => unsubscribe(); // Limpar o listener
  }, [currentUser]); // Re-executar se o usuário mudar

  // Carregar transações do Realtime Database
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]); // Limpa as transações se não houver usuário
      return;
    }
    const transactionsPath = `users/${currentUser.uid}/appTransactions`;
    const transactionsNodeRef = ref(db, transactionsPath);
    // Exemplo: ordenar por data (armazenada como string ISO ou timestamp)
    // Para orderByChild("date") funcionar bem, considere armazenar datas como YYYY-MM-DD ou timestamps.
    // Se armazenar como string ISO, a ordenação lexicográfica pode funcionar.
    const transactionsQuery = query(transactionsNodeRef, orderByChild("date"));

    const unsubscribe = onValue(transactionsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList: Transaction[] = Object.keys(data).map(
          (key) => ({
            id: key,
            ...data[key],
            date: new Date(data[key].date), // Converter string de data para objeto Date
            createdAt: new Date(data[key].createdAt), // Converter string de data para objeto Date
          })
        );
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]); // Re-executar se o usuário mudar

  // Adicionar uma nova categoria
  const addCategory = async (
    categoryData: Omit<Category, "id" | "createdAt">
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para adicionar uma categoria.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const categoriesNodeRef = ref(
        db,
        `users/${currentUser.uid}/appCategories`
      );
      const newCategoryRef = push(categoriesNodeRef); // Gera um ID único
      const categoryToSave = { ...categoryData, createdAt: serverTimestamp() };
      await set(newCategoryRef, categoryToSave);
      return {
        ...categoryData,
        id: newCategoryRef.key!,
        createdAt: new Date(),
      } as Category;
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível adicionar a categoria.";
      console.error("Erro ao adicionar categoria: ", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  // Atualizar uma categoria existente
  const updateCategory = async (
    id: string,
    categoryUpdates: Partial<Omit<Category, "id">>
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para atualizar uma categoria.",
        variant: "destructive",
      });
      return;
    }
    try {
      const categoryRef = ref(
        db,
        `users/${currentUser.uid}/appCategories/${id}`
      );
      // Para RTDB, se categoryUpdates não incluir createdAt, ele será removido se usarmos set.
      // `update` é mais seguro para atualizações parciais.
      await update(categoryRef, categoryUpdates);
      toast({ title: "Sucesso!", description: "Categoria atualizada." });
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível atualizar a categoria.";
      console.error("Erro ao atualizar categoria: ", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Deletar uma categoria
  const deleteCategory = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para deletar uma categoria.",
        variant: "destructive",
      });
      return;
    }
    try {
      const categoryRef = ref(
        db,
        `users/${currentUser.uid}/appCategories/${id}`
      );
      await remove(categoryRef);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível deletar a categoria.";
      console.error("Erro ao deletar categoria: ", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Adicionar uma nova transação
  const addTransaction = async (
    transactionData: Omit<Transaction, "id" | "createdAt" | "category">
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para adicionar uma transação.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const transactionsNodeRef = ref(
        db,
        `users/${currentUser.uid}/appTransactions`
      );
      const newTransactionRef = push(transactionsNodeRef);

      // Construir o objeto a ser salvo, garantindo que não haja 'undefined'
      const transactionToSave: any = {
        // Usar 'any' temporariamente para flexibilidade na construção
        description: transactionData.description,
        amount: transactionData.amount,
        categoryId: transactionData.categoryId,
        date: transactionData.date.toISOString(), // Salvar data como string ISO
        type: transactionData.type,
        storeId: transactionData.storeId, // Assumindo que storeId é obrigatório e validado no formulário
        createdAt: serverTimestamp(), // Usar timestamp do servidor para createdAt
      };

      // Adicionar 'discount' apenas se for um número válido e maior que 0
      if (
        typeof transactionData.discount === "number" &&
        transactionData.discount > 0
      ) {
        transactionToSave.discount = transactionData.discount;
      }

      await set(newTransactionRef, transactionToSave);
      toast({ title: "Sucesso!", description: "Transação adicionada." });
      return {
        ...transactionData,
        id: newTransactionRef.key!,
        createdAt: new Date(),
      }; // Retornar com ID e data convertida
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível adicionar a transação.";
      console.error("Erro ao adicionar transação:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  // Atualizar uma transação existente
  const updateTransaction = async (
    id: string,
    transactionUpdates: Partial<Omit<Transaction, "id" | "category">> | null
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para atualizar uma transação.",
        variant: "destructive",
      });
      return;
    }
    if (transactionUpdates === null) {
      return; // Cancela a edição
    }
    try {
      const transactionRef = ref(
        db,
        `users/${currentUser.uid}/appTransactions/${id}`
      );
      const updatesToSave: any = { ...transactionUpdates }; // Usar 'any' temporariamente

      if (transactionUpdates.date) {
        updatesToSave.date = transactionUpdates.date.toISOString();
      }

      // Tratar 'discount' especificamente:
      // Se 'discount' está presente em transactionUpdates e é 0 ou null, queremos remover o campo ou setar para null.
      // Se for um número > 0, o mantemos.
      if (transactionUpdates.hasOwnProperty("discount")) {
        if (
          typeof transactionUpdates.discount === "number" &&
          transactionUpdates.discount > 0
        ) {
          updatesToSave.discount = transactionUpdates.discount;
        } else {
          updatesToSave.discount = null; // Firebase removerá o campo se for null
        }
      }

      await update(transactionRef, updatesToSave);
      toast({ title: "Sucesso!", description: "Transação atualizada." });
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível atualizar a transação.";
      console.error("Erro ao atualizar transação:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Deletar uma transação
  const deleteTransaction = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para deletar uma transação.",
        variant: "destructive",
      });
      return;
    }
    try {
      const transactionRef = ref(
        db,
        `users/${currentUser.uid}/appTransactions/${id}`
      );
      await remove(transactionRef);
      toast({ title: "Sucesso!", description: "Transação deletada." });
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível deletar a transação.";
      console.error("Erro ao deletar transação:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Calcular o resumo financeiro
  const summary = useMemo((): FinancialSummary => {
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
      const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      startDate = new Date(sortedTransactions[0].date);
      endDate = new Date(
        sortedTransactions[sortedTransactions.length - 1].date
      );
    }

    const calculatedSummary = {
      totalIncome: income,
      totalExpenses: expense,
      balance: income - expense,
      transactionCount: transactions.length,
      startDate,
      endDate,
    };
    return calculatedSummary;
  }, [transactions]); // Dependência correta

  // Remover transações de uma data e loja específicas
  // Esta função será chamada após um fechamento de caixa que incluiu essas transações
  const removeTransactionsByDateAndStore = async (
    dateToRemove: Date,
    storeId: string
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Operação não permitida sem login.",
        variant: "destructive",
      });
      return;
    }
    const transactionsRef = ref(db, `users/${currentUser.uid}/appTransactions`);
    // Para RTDB, a filtragem complexa no cliente é mais comum, ou você precisa de estruturas de dados/índices muito específicos.
    // Aqui, vamos buscar todas e filtrar no cliente, depois remover individualmente.
    // Para otimizar, você poderia criar um índice composto no Firebase se as queries forem frequentes.
    try {
      const snapshot = await get(transactionsRef);
      if (snapshot.exists()) {
        const allTransactions = snapshot.val();
        const transactionIdsToRemove: string[] = [];
        Object.keys(allTransactions).forEach((key) => {
          const t = allTransactions[key];
          const transactionDate = new Date(t.date); // Assegure-se que t.date é uma string de data válida
          if (
            t.storeId === storeId &&
            transactionDate.getFullYear() === dateToRemove.getFullYear() &&
            transactionDate.getMonth() === dateToRemove.getMonth() &&
            transactionDate.getDate() === dateToRemove.getDate()
          ) {
            transactionIdsToRemove.push(key);
          }
        });
        const removalPromises = transactionIdsToRemove.map((id) =>
          remove(ref(db, `users/${currentUser.uid}/appTransactions/${id}`))
        );
        await Promise.all(removalPromises);
        if (transactionIdsToRemove.length > 0) {
          toast({
            title: "Sucesso!",
            description: "Transações do fechamento anterior removidas.",
          });
        }
      }
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível remover as transações do fechamento anterior.";
      console.error("Erro ao remover transações por data e loja:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
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
