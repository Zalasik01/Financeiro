import { useToast } from "@/hooks/use-toast"; // Importar o hook de toast
import { useAuth } from "@/hooks/useAuth"; // Importar o hook de autenticação
import { Category, FinancialSummary, Transaction } from "@/types/finance";
import { useEffect, useMemo, useState } from "react";
// Firebase imports removidos - migrado para Supabase

export const useFinance = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currentUser, selectedBaseId } = useAuth(); // Obter o usuário atual e o selectedBaseId
  const { toast } = useToast(); // Inicializar o hook de toast

  // Carregar categorias do Realtime Database
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      setCategories([]); // Limpa as categorias se não houver usuário
      return;
    }
    const categoriesPath = `clientBases/${selectedBaseId}/appCategories`; // Caminho atualizado
    const categoriesNodeRef = ref(db, categoriesPath);
    // Para ordenar por nome no RTDB, você precisará configurar .indexOn: ["name"] nas regras do Firebase
    const categoriesQuery = query(categoriesNodeRef, orderByChild("name"));

    const unsubscribe = onValue(categoriesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriesList: Category[] = Object.keys(data).map((key) => {
          const categoryEntry = data[key];
          // Mapear 'income' para 'Receita' e 'expense' para 'Despesa' ao carregar categorias
          let mappedCategoryType: "Receita" | "Despesa";
          if (categoryEntry.type === "income") {
            mappedCategoryType = "Receita";
          } else if (categoryEntry.type === "expense") {
            mappedCategoryType = "Despesa";
          } else {
            mappedCategoryType = categoryEntry.type; // Assume que já está no formato correto
          }
          return {
            id: key,
            ...categoryEntry,
            type: mappedCategoryType,
            createdAt: new Date(categoryEntry.createdAt),
          };
        });
        setCategories(categoriesList);
      } else {
        setCategories([]);
      }
    });

    return () => unsubscribe(); // Limpar o listener
  }, [currentUser, selectedBaseId]); // Re-executar se o usuário ou a base mudar

  // Carregar transações do Realtime Database
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      setTransactions([]); // Limpa as transações se não houver usuário
      return;
    }
    const transactionsPath = `clientBases/${selectedBaseId}/appTransactions`; // Caminho atualizado
    const transactionsNodeRef = ref(db, transactionsPath);
    // Exemplo: ordenar por data (armazenada como string ISO ou timestamp)
    // Para orderByChild("date") funcionar bem, considere armazenar datas como YYYY-MM-DD ou timestamps.
    // Se armazenar como string ISO, a ordenação lexicográfica pode funcionar.
    const transactionsQuery = query(transactionsNodeRef, orderByChild("date"));

    const unsubscribe = onValue(transactionsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList: Transaction[] = Object.keys(data).map((key) => {
          const entry = data[key];
          // Mapear 'income' para 'Receita' e 'expense' para 'Despesa'
          let mappedType: "Receita" | "Despesa";
          if (entry.type === "income") {
            mappedType = "Receita";
          } else if (entry.type === "expense") {
            mappedType = "Despesa";
          } else {
            mappedType = entry.type; // Assume que já está no formato correto
          }
          return {
            id: key,
            ...entry,
            type: mappedType,
            date: new Date(entry.date),
            createdAt: new Date(entry.createdAt),
            personId: entry.personId ?? null,
          };
        });
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser, selectedBaseId]); // Re-executar se o usuário ou a base mudar

  // Adicionar uma nova categoria
  const addCategory = async (
    categoryData: Omit<Category, "id" | "createdAt">
  ) => {
    if (!currentUser || !selectedBaseId) {
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
        `clientBases/${selectedBaseId}/appCategories`
      ); // Caminho atualizado
      const newCategoryRef = push(categoriesNodeRef); // Gera um ID único
      const categoryToSave = { ...categoryData, createdAt: serverTimestamp() };
      await set(newCategoryRef, categoryToSave);
      return {
        ...categoryData,
        id: newCategoryRef.key!,
        createdAt: new Date(),
      } as Category;
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message || "Não foi possível adicionar a categoria.";
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
    if (!currentUser || !selectedBaseId) {
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
        `clientBases/${selectedBaseId}/appCategories/${id}`
      ); // Caminho atualizado
      // Para RTDB, se categoryUpdates não incluir createdAt, ele será removido se usarmos set.
      // `update` é mais seguro para atualizações parciais.
      await update(categoryRef, categoryUpdates);
      toast({ title: "Sucesso!", description: "Categoria atualizada." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message || "Não foi possível atualizar a categoria.";
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const categoryRef = ref(
        db,
        `clientBases/${selectedBaseId}/appCategories/${id}`
      ); // Caminho atualizado
      await remove(categoryRef);
      toast({ title: "Sucesso!", description: "Categoria deletada." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message || "Não foi possível deletar a categoria.";
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const transactionsNodeRef = ref(
        db,
        `clientBases/${selectedBaseId}/appTransactions` // Caminho atualizado
      );
      const newTransactionRef = push(transactionsNodeRef);

      // Construir o objeto a ser salvo, garantindo que não haja 'undefined'
      const transactionToSave: Partial<Transaction> & { createdAt: object } = {
        // Usar 'any' temporariamente para flexibilidade na construção
        description: transactionData.description,
        amount: transactionData.amount,
        categoryId: transactionData.categoryId,
        date: transactionData.date.toISOString(),
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

      // Adicionar 'personId' se estiver presente em transactionData
      if (transactionData.personId) {
        transactionToSave.personId = transactionData.personId;
      }

      await set(newTransactionRef, transactionToSave);
      return {
        ...transactionData,
        id: newTransactionRef.key!,
        createdAt: new Date(),
      } as Transaction; // Retornar com ID e data convertida
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message || "Não foi possível adicionar a transação.";
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
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
        `clientBases/${selectedBaseId}/appTransactions/${id}`
      ); // Caminho atualizado
      // Use Record<string, any> for the object to be passed to Firebase `update`
      // to allow for type differences (e.g., Date vs. string for date field).
      const updatesToSave: Record<string, unknown> = { ...transactionUpdates };

      // Explicitly type dateToUpdate to avoid implicit any if transactionUpdates.date is not strictly Date | string
      const dateToUpdate: Date | string | undefined | null =
        transactionUpdates.date;
      if (
        dateToUpdate &&
        typeof dateToUpdate !== "string" &&
        dateToUpdate instanceof Date
      ) {
        updatesToSave.date = dateToUpdate.toISOString(); // Firebase expects string
      }

      // Tratar 'discount' especificamente:
      // Se 'discount' está presente em transactionUpdates e é 0 ou null, queremos remover o campo ou setar para null.
      // Se for um número > 0, o mantemos.
      if (
        Object.prototype.hasOwnProperty.call(transactionUpdates, "discount")
      ) {
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
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message || "Não foi possível atualizar a transação.";
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const transactionRef = ref(
        db,
        `clientBases/${selectedBaseId}/appTransactions/${id}`
      ); // Caminho atualizado
      await remove(transactionRef);
      toast({
        title: "Sucesso!",
        description: "Transação deletada.",
        variant: "success",
      });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message || "Não foi possível deletar a transação.";
      console.error("Erro ao deletar transação:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Calcular o resumo financeiro com otimização
  const summary = useMemo((): FinancialSummary => {
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
        startDate: null,
        endDate: null,
      };
    }

    let income = 0;
    let expense = 0;
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // Uma única iteração para calcular tudo
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);

      // Calcular receitas e despesas
      if (transaction.type === "Receita") {
        income += transaction.amount;
      } else if (transaction.type === "Despesa") {
        expense += Math.abs(transaction.amount);
      }

      // Calcular datas de início e fim
      if (!startDate || transactionDate < startDate) {
        startDate = transactionDate;
      }
      if (!endDate || transactionDate > endDate) {
        endDate = transactionDate;
      }
    });

    return {
      totalIncome: income,
      totalExpenses: expense,
      balance: income - expense,
      transactionCount: transactions.length,
      startDate,
      endDate,
    };
  }, [transactions.length, transactions]); // Otimização: inclui length para triggers mais específicos

  // Remover transações de uma data e loja específicas
  // Esta função será chamada após um fechamento de caixa que incluiu essas transações
  const removeTransactionsByDateAndStore = async (
    dateToRemove: Date,
    storeId: string
  ) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    // Para RTDB, a filtragem complexa no cliente é mais comum, ou você precisa de estruturas de dados/índices muito específicos.
    // Aqui, vamos buscar todas e filtrar no cliente, depois remover individualmente.
    // Para otimizar, você poderia criar um índice composto no Firebase se as queries forem frequentes.
    try {
      const snapshot = await get(
        ref(db, `clientBases/${selectedBaseId}/appTransactions`)
      ); // Caminho atualizado
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
        const removalPromises = transactionIdsToRemove.map(
          (id) =>
            remove(
              ref(db, `clientBases/${selectedBaseId}/appTransactions/${id}`)
            ) // Caminho atualizado
        );
        await Promise.all(removalPromises);
        if (transactionIdsToRemove.length > 0) {
          toast({
            title: "Sucesso!",
            description: "Transações do fechamento anterior removidas.",
          });
        }
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage =
        error.message ||
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
