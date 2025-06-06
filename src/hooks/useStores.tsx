import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Store,
  StoreClosing,
  PaymentMethod,
  MovementType,
  MovementItem,
  DREData,
  StoreMeta,
  StoreRanking,
} from "@/types/store";
import { useAuth } from "@/hooks/useAuth"; // Importar o hook de autenticação
import { useToast } from "@/hooks/use-toast"; // Importar o hook de toast
import { db } from "@/firebase"; // Importar a instância do RTDB
import {
  ref,
  onValue,
  push,
  set,
  remove,
  update,
  query,
  orderByChild,
  serverTimestamp,
  get,
  equalTo,
} from "firebase/database"; // Adicionado get e equalTo

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [closings, setClosings] = useState<StoreClosing[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [goals, setGoals] = useState<StoreMeta[]>([]);
  const { currentUser } = useAuth(); // Obter o usuário atual
  const { toast } = useToast(); // Inicializar o hook de toast

  // Carregar Lojas
  useEffect(() => {
    if (!currentUser) {
      setStores([]);
      return;
    }
    const storesPath = `users/${currentUser.uid}/appStores`;
    const storesNodeRef = ref(db, storesPath);
    const storesQuery = query(storesNodeRef, orderByChild("name"));
    const unsubscribe = onValue(storesQuery, (snapshot) => {
      console.log("[useStores] Snapshot recebido para lojas:", snapshot.val());
      const data = snapshot.val();
      if (data) {
        const list: Store[] = Object.keys(data).map((key) => {
          const storeEntry = data[key];
          let createdAtDate: Date;
          // Verifica se createdAt existe e é um número (timestamp) ou uma string (ISO date)
          if (
            storeEntry.createdAt &&
            (typeof storeEntry.createdAt === "number" ||
              typeof storeEntry.createdAt === "string")
          ) {
            createdAtDate = new Date(storeEntry.createdAt);
          } else {
            // Fallback se createdAt for inválido ou ausente
            console.warn(
              `[useStores] Loja ${key} createdAt tem formato inválido ou está ausente:`,
              storeEntry.createdAt,
              ". Usando data atual como fallback."
            );
            createdAtDate = new Date();
          }
          return {
            id: key,
            ...storeEntry,
            createdAt: createdAtDate,
          };
        });
        console.log("[useStores] Lista de lojas processada:", list);
        setStores(list);
      } else {
        console.log("[useStores] Nenhum dado de loja encontrado no Firebase.");
        setStores([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Carregar Métodos de Pagamento
  useEffect(() => {
    if (!currentUser) {
      setPaymentMethods([]);
      return;
    }
    const methodsPath = `users/${currentUser.uid}/appPaymentMethods`;
    const methodsNodeRef = ref(db, methodsPath);
    const methodsQuery = query(methodsNodeRef, orderByChild("name"));
    const unsubscribe = onValue(methodsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: PaymentMethod[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          createdAt: new Date(data[key].createdAt),
        }));
        setPaymentMethods(list);
      } else {
        setPaymentMethods([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Carregar Tipos de Movimento
  useEffect(() => {
    if (!currentUser) {
      setMovementTypes([]);
      return;
    }
    const typesPath = `users/${currentUser.uid}/appMovementTypes`;
    const typesNodeRef = ref(db, typesPath);
    const typesQuery = query(typesNodeRef, orderByChild("name"));
    const unsubscribe = onValue(typesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: MovementType[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          createdAt: new Date(data[key].createdAt),
        }));
        setMovementTypes(list);
      } else {
        setMovementTypes([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Carregar Fechamentos (Closings)
  useEffect(() => {
    if (!currentUser) {
      setClosings([]);
      return;
    }
    const closingsPath = `users/${currentUser.uid}/appClosings`;
    // Ordenar por data de fechamento, por exemplo
    const closingsNodeRef = ref(db, closingsPath);
    const closingsQuery = query(closingsNodeRef, orderByChild("closingDate"));
    const unsubscribe = onValue(closingsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: StoreClosing[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          closingDate: new Date(data[key].closingDate),
          createdAt: new Date(data[key].createdAt),
          // movements são armazenados como objetos, precisam ser convertidos para array se necessário
          movements: data[key].movements
            ? Object.values(data[key].movements)
            : [],
        }));
        setClosings(list);
      } else {
        setClosings([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Carregar Metas (Goals)
  useEffect(() => {
    if (!currentUser) {
      setGoals([]);
      return;
    }
    const goalsPath = `users/${currentUser.uid}/appGoals`;
    const goalsNodeRef = ref(db, goalsPath);
    const goalsQuery = query(goalsNodeRef, orderByChild("targetDate")); // Exemplo de ordenação
    const unsubscribe = onValue(goalsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: StoreMeta[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          createdAt: new Date(data[key].createdAt),
          targetDate: data[key].targetDate
            ? new Date(data[key].targetDate)
            : undefined,
        }));
        setGoals(list);
      } else {
        setGoals([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const addStore = async (storeData: Omit<Store, "id" | "createdAt">) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para adicionar uma loja.",
        variant: "destructive",
      });
      return null;
    }
    console.log("[useStores] Tentando adicionar loja. Dados:", storeData);
    try {
      const storesNodeRef = ref(db, `users/${currentUser.uid}/appStores`);
      const newStoreRef = push(storesNodeRef);
      // Garante que campos opcionais sejam null se vazios, em vez de undefined
      const preparedStoreData = {
        ...storeData,
        nickname: storeData.nickname || null,
        code: storeData.code || null,
      };
      const storeToSave = {
        ...preparedStoreData,
        createdAt: serverTimestamp(),
      };
      console.log(
        "[useStores] Dados para salvar no Firebase:",
        storeToSave,
        "para ref:",
        newStoreRef.toString()
      );

      await set(newStoreRef, storeToSave);
      console.log(
        "[useStores] Promessa da operação set do Firebase resolvida para o ID da loja:",
        newStoreRef.key
      );
      return { ...storeData, id: newStoreRef.key!, createdAt: new Date() };
    } catch (error) {
      const firebaseError = error as Error;
      console.error(
        "[useStores] Erro ao adicionar loja ao Firebase:",
        firebaseError
      );
      // É útil registrar o código se for um AuthError do Firebase ou similar
      if ((firebaseError as any).code) {
        console.error(
          "[useStores] Código de erro do Firebase:",
          (firebaseError as any).code
        );
      }
      const errorMessage =
        firebaseError.message || "Não foi possível adicionar a loja.";
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStore = async (
    id: string,
    storeUpdates: Partial<Omit<Store, "id" | "createdAt">>
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para atualizar uma loja.",
        variant: "destructive",
      });
      return;
    }
    try {
      const storeRef = ref(db, `users/${currentUser.uid}/appStores/${id}`);
      await update(storeRef, storeUpdates);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível atualizar a loja.";
      console.error("Erro ao atualizar loja:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteStore = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para deletar uma loja.",
        variant: "destructive",
      });
      return;
    }
    try {
      const storeRef = ref(db, `users/${currentUser.uid}/appStores/${id}`);
      await remove(storeRef);

      // Remover fechamentos e metas associados
      const closingsQuery = query(
        ref(db, `users/${currentUser.uid}/appClosings`),
        orderByChild("storeId"),
        equalTo(id)
      );
      onValue(
        closingsQuery,
        (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            remove(childSnapshot.ref);
          });
        },
        { onlyOnce: true }
      );

      const goalsQuery = query(
        ref(db, `users/${currentUser.uid}/appGoals`),
        orderByChild("storeId"),
        equalTo(id)
      );
      onValue(
        goalsQuery,
        (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            remove(childSnapshot.ref);
          });
        },
        { onlyOnce: true }
      );
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível deletar a loja.";
      console.error("Erro ao deletar loja:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
    // A atualização do estado local de closings e goals será feita pelos listeners do RTDB
  };

  const addPaymentMethod = async (
    methodData: Omit<PaymentMethod, "id" | "createdAt">
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description:
          "Você precisa estar logado para adicionar um método de pagamento.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const methodsNodeRef = ref(
        db,
        `users/${currentUser.uid}/appPaymentMethods`
      );
      const newMethodRef = push(methodsNodeRef);
      const methodToSave = { ...methodData, createdAt: serverTimestamp() };
      await set(newMethodRef, methodToSave);
      toast({
        title: "Sucesso!",
        description: "Método de pagamento adicionado.",
      });
      return { ...methodData, id: newMethodRef.key!, createdAt: new Date() };
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível adicionar o método de pagamento.";
      console.error("Erro ao adicionar método de pagamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePaymentMethod = async (
    id: string,
    methodUpdates: Partial<Omit<PaymentMethod, "id" | "createdAt">>
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description:
          "Você precisa estar logado para atualizar um método de pagamento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const methodRef = ref(
        db,
        `users/${currentUser.uid}/appPaymentMethods/${id}`
      );
      await update(methodRef, methodUpdates);
      toast({
        title: "Sucesso!",
        description: "Método de pagamento atualizado.",
      });
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível atualizar o método de pagamento.";
      console.error("Erro ao atualizar método de pagamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deletePaymentMethod = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description:
          "Você precisa estar logado para deletar um método de pagamento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const methodRef = ref(
        db,
        `users/${currentUser.uid}/appPaymentMethods/${id}`
      );
      await remove(methodRef);
      toast({
        title: "Sucesso!",
        description: "Método de pagamento deletado.",
      });
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível deletar o método de pagamento.";
      console.error("Erro ao deletar método de pagamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const addMovementType = async (
    typeData: Omit<MovementType, "id" | "createdAt">
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description:
          "Você precisa estar logado para adicionar um tipo de movimento.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const typesNodeRef = ref(db, `users/${currentUser.uid}/appMovementTypes`);
      const newTypeRef = push(typesNodeRef);
      const typeToSave = { ...typeData, createdAt: serverTimestamp() };
      await set(newTypeRef, typeToSave);
      toast({
        title: "Sucesso!",
        description: "Tipo de movimento adicionado.",
      });
      return { ...typeData, id: newTypeRef.key!, createdAt: new Date() };
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível adicionar o tipo de movimento.";
      console.error("Erro ao adicionar tipo de movimento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMovementType = async (
    id: string,
    typeUpdates: Partial<Omit<MovementType, "id" | "createdAt">>
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description:
          "Você precisa estar logado para atualizar um tipo de movimento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const typeRef = ref(
        db,
        `users/${currentUser.uid}/appMovementTypes/${id}`
      );
      await update(typeRef, typeUpdates);
      toast({
        title: "Sucesso!",
        description: "Tipo de movimento atualizado.",
      });
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível atualizar o tipo de movimento.";
      console.error("Erro ao atualizar tipo de movimento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteMovementType = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description:
          "Você precisa estar logado para deletar um tipo de movimento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const typeRef = ref(
        db,
        `users/${currentUser.uid}/appMovementTypes/${id}`
      );
      await remove(typeRef);
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Não foi possível deletar o tipo de movimento.";
      console.error("Erro ao deletar tipo de movimento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const movementTypeMap = useMemo(() => {
    return new Map(movementTypes.map((type) => [type.id, type]));
  }, [movementTypes]);

  const calculateTotals = useCallback(
    (movements: MovementItem[]) => {
      const totalEntradas = movements
        .filter((m) => {
          const type = movementTypeMap.get(m.movementTypeId);
          return type?.category === "entrada";
        })
        .reduce((sum, m) => sum + m.amount - (m.discount || 0), 0);

      const totalSaidas = movements
        .filter((m) => {
          const type = movementTypeMap.get(m.movementTypeId);
          return type?.category === "saida";
        })
        .reduce((sum, m) => sum + m.amount, 0);

      const totalOutros = movements
        .filter((m) => {
          const type = movementTypeMap.get(m.movementTypeId);
          return type?.category === "outros";
        })
        .reduce((sum, m) => sum + m.amount, 0);

      return { totalEntradas, totalSaidas, totalOutros };
    },
    [movementTypeMap]
  );

  const addStoreClosing = async (
    closingData: Omit<
      // Renomeado parâmetro para consistência interna
      StoreClosing,
      | "id"
      | "createdAt"
      | "totalEntradas"
      | "totalSaidas"
      | "totalOutros"
      | "netResult"
    >
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para adicionar um fechamento.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const closingsNodeRef = ref(db, `users/${currentUser.uid}/appClosings`);
      const newClosingRef = push(closingsNodeRef);

      const { totalEntradas, totalSaidas, totalOutros } = calculateTotals(
        closingData.movements || []
      );

      // Para RTDB, é melhor armazenar movements como um objeto com chaves (IDs)
      // ou garantir que os IDs dos movements sejam únicos se forem um array.
      // Se os movements já têm IDs, podemos usá-los como chaves.
      // Por simplicidade, se movements é um array, vamos mantê-lo assim,
      // mas para edições/remoções de movements individuais, um objeto seria melhor.
      const movementsToSave = (closingData.movements || []).map(
        (m: MovementItem) => ({
          // Adicionada tipagem para m
          ...m,
          // Se movementId não existir, pode ser gerado aqui ou assumir que já existe
          id:
            m.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          storeClosingId: newClosingRef.key!,
        })
      );

      const closingToSave = {
        ...closingData,
        closingDate: closingData.closingDate.toISOString(),
        movements: movementsToSave, // Salva o array de movements
        totalEntradas,
        totalSaidas,
        totalOutros,
        netResult:
          (closingData.finalBalance || 0) - (closingData.initialBalance || 0), // Adicionado fallback para 0
        createdAt: serverTimestamp(),
      };

      await set(newClosingRef, closingToSave);
      return {
        ...closingData,
        id: newClosingRef.key!,
        movements: movementsToSave,
        totalEntradas,
        totalSaidas,
        totalOutros,
        netResult:
          (closingData.finalBalance || 0) - (closingData.initialBalance || 0), // Adicionado fallback para 0
        createdAt: new Date(),
      };
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível adicionar o fechamento.";
      console.error("Erro ao adicionar fechamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateClosing = async (
    id: string,
    closingUpdates: Partial<Omit<StoreClosing, "id" | "createdAt">>
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para atualizar um fechamento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const closingRef = ref(db, `users/${currentUser.uid}/appClosings/${id}`);
      const updatesToSave: Partial<StoreClosing> = { ...closingUpdates }; // Tipagem mais específica

      if (closingUpdates.closingDate) {
        (updatesToSave as any).closingDate =
          closingUpdates.closingDate.toISOString();
      }

      // Se movements forem atualizados, recalcular totais
      if (closingUpdates.movements) {
        const { totalEntradas, totalSaidas, totalOutros } = calculateTotals(
          closingUpdates.movements
        );
        updatesToSave.totalEntradas = totalEntradas;
        updatesToSave.totalSaidas = totalSaidas;
        updatesToSave.totalOutros = totalOutros;

        let currentClosingData;
        if (
          closingUpdates.finalBalance === undefined ||
          closingUpdates.initialBalance === undefined
        ) {
          const snapshot = await get(closingRef);
          currentClosingData = snapshot.val();
        }

        const finalBalance =
          closingUpdates.finalBalance !== undefined
            ? closingUpdates.finalBalance
            : currentClosingData?.finalBalance || 0;
        const initialBalance =
          closingUpdates.initialBalance !== undefined
            ? closingUpdates.initialBalance
            : currentClosingData?.initialBalance || 0;
        updatesToSave.netResult = finalBalance - initialBalance;
      }

      await update(closingRef, updatesToSave);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível atualizar o fechamento.";
      console.error("Erro ao atualizar fechamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteClosing = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para deletar um fechamento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const closingRef = ref(db, `users/${currentUser.uid}/appClosings/${id}`);
      await remove(closingRef);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível deletar o fechamento.";
      console.error("Erro ao deletar fechamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const closingsWithDetails = useMemo(() => {
    return closings.map((closing) => ({
      ...closing,
      store: stores.find((store) => store.id === closing.storeId),
      movements: (closing.movements || []).map((movement: MovementItem) => ({
        // Garante que movements seja um array e tipa movement
        ...movement,
        movementType: movementTypes.find(
          (type) => type.id === movement.movementTypeId
        ),
        paymentMethod: paymentMethods.find(
          (method) => method.id === movement.paymentMethodId
        ),
      })),
    }));
  }, [closings, stores, movementTypes, paymentMethods]);

  // Função auxiliar para obter detalhes de fechamento, caso precise fora do retorno principal
  // const getClosingsWithDetails = closingsWithDetails;

  const generateDRE = (
    startDate: Date,
    endDate: Date,
    storeId?: string
  ): DREData => {
    const filteredClosings = closings.filter((closing) => {
      const closingDate = new Date(closing.closingDate);
      const matchesStore = !storeId || closing.storeId === storeId;
      return matchesStore && closingDate >= startDate && closingDate <= endDate;
    });

    const filteredStores = storeId
      ? stores.filter((store) => store.id === storeId)
      : stores;

    const storeResults = filteredStores
      .map((store) => {
        const storeClosings = filteredClosings.filter(
          (closing) => closing.storeId === store.id
        );
        const totalReceitas = storeClosings.reduce(
          (sum, closing) => sum + closing.totalEntradas,
          0
        );
        const totalDespesas = storeClosings.reduce(
          (sum, closing) => sum + closing.totalSaidas,
          0
        );

        return {
          store,
          closings: storeClosings,
          totalReceitas,
          totalDespesas,
          resultadoLiquido: totalReceitas - totalDespesas,
        };
      })
      .filter((storeResult) => storeResult.closings.length > 0);

    const consolidated = {
      totalReceitas: storeResults.reduce(
        (sum, result) => sum + result.totalReceitas,
        0
      ),
      totalDespesas: storeResults.reduce(
        (sum, result) => sum + result.totalDespesas,
        0
      ),
      resultadoLiquido: storeResults.reduce(
        (sum, result) => sum + result.resultadoLiquido,
        0
      ),
    };

    return {
      period: `${startDate.toLocaleDateString(
        "pt-BR"
      )} - ${endDate.toLocaleDateString("pt-BR")}`,
      stores: storeResults,
      consolidated,
    };
  };

  const addGoal = async (goalData: Omit<StoreMeta, "id" | "createdAt">) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para adicionar uma meta.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const goalsNodeRef = ref(db, `users/${currentUser.uid}/appGoals`);
      const newGoalRef = push(goalsNodeRef);
      const goalToSave = {
        ...goalData,
        createdAt: serverTimestamp(),
        targetDate: goalData.targetDate
          ? goalData.targetDate.toISOString()
          : null,
      };
      await set(newGoalRef, goalToSave);
      return { ...goalData, id: newGoalRef.key!, createdAt: new Date() };
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível adicionar a meta.";
      console.error("Erro ao adicionar meta:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateGoal = async (
    id: string,
    goalUpdates: Partial<Omit<StoreMeta, "id" | "createdAt">>
  ) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para atualizar uma meta.",
        variant: "destructive",
      });
      return;
    }
    try {
      const goalRef = ref(db, `users/${currentUser.uid}/appGoals/${id}`);
      const updatesToSave = { ...goalUpdates } as any;
      if (goalUpdates.targetDate) {
        updatesToSave.targetDate = goalUpdates.targetDate.toISOString();
      }
      await update(goalRef, updatesToSave);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível atualizar a meta.";
      console.error("Erro ao atualizar meta:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para deletar uma meta.",
        variant: "destructive",
      });
      return;
    }
    try {
      const goalRef = ref(db, `users/${currentUser.uid}/appGoals/${id}`);
      await remove(goalRef);
    } catch (error) {
      const errorMessage =
        (error as Error).message || "Não foi possível deletar a meta.";
      console.error("Erro ao deletar meta:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const storeRankings = useMemo((): StoreRanking[] => {
    return stores.map((store) => {
      const storeClosings = closings.filter((c) => c.storeId === store.id);
      const totalClosings = storeClosings.length;
      const totalRevenue = storeClosings.reduce(
        (sum, c) => sum + c.totalEntradas,
        0
      );
      const totalExpenses = storeClosings.reduce(
        (sum, c) => sum + c.totalSaidas,
        0
      );

      const totalInitialBalance = storeClosings.reduce(
        (sum, c) => sum + c.initialBalance,
        0
      );
      const totalFinalBalance = storeClosings.reduce(
        (sum, c) => sum + c.finalBalance,
        0
      );
      const averageBalance =
        totalClosings > 0
          ? (totalInitialBalance + totalFinalBalance) / (totalClosings * 2)
          : 0;

      const sortedClosings = [...storeClosings].sort(
        (a, b) =>
          new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime()
      );

      return {
        store,
        totalClosings,
        totalRevenue,
        totalExpenses,
        averageBalance,
        lastClosingDate:
          sortedClosings.length > 0
            ? new Date(sortedClosings[0].closingDate)
            : undefined,
      };
    });
  }, [stores, closings]);

  return {
    stores,
    closings: closingsWithDetails, // Usa a versão memoizada
    paymentMethods,
    movementTypes,
    goals,
    addStore,
    updateStore,
    deleteStore,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addMovementType,
    updateMovementType,
    deleteMovementType,
    addStoreClosing,
    updateClosing,
    deleteClosing,
    generateDRE,
    addGoal,
    updateGoal,
    deleteGoal,
    storeRankings, // Retornar o valor memoizado
  };
};
