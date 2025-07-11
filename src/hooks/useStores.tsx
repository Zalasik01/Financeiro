import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Base,
  ClientBase,
  DREData,
  MovementItem,
  MovementType,
  PaymentMethod,
  Store,
  StoreClosing,
  StoreMeta,
  StoreRanking,
} from "@/types/store";
import {
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { useCallback, useEffect, useMemo, useState } from "react";

export const useStores = () => {
  const [bases, setBases] = useState<Base[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [closings, setClosings] = useState<StoreClosing[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [goals, setGoals] = useState<StoreMeta[]>([]);
  const { currentUser, selectedBaseId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      console.log("🏪 [useStores] Sem usuário - limpando bases");
      setBases([]);
      return;
    }

    console.log("🏪 [useStores] Carregando bases para usuário:", {
      email: currentUser.email,
      isAdmin: currentUser.isAdmin,
      uid: currentUser.uid,
    });

    const clientBasesRef = ref(db, "clientBases");
    const unsubscribeBases = onValue(
      clientBasesRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log("🏪 [useStores] Dados recebidos do Firebase:", {
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
        });

        if (data) {
          const allClientBases: ClientBase[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          console.log("🏪 [useStores] Todas as bases do Firebase:", {
            totalBases: allClientBases.length,
            bases: allClientBases.map((cb) => ({
              id: cb.id,
              name: cb.name,
              ativo: cb.ativo,
              createdBy: cb.createdBy,
              hasAuthorizedUIDs: !!cb.authorizedUIDs,
            })),
          });

          let accessibleClientBases: ClientBase[];

          if (currentUser.isAdmin) {
            console.log(
              "🏪 [useStores] Usuário é admin - todas as bases acessíveis"
            );
            accessibleClientBases = allClientBases;
          } else {
            console.log("🏪 [useStores] Usuário não é admin - filtrando bases");
            accessibleClientBases = allClientBases.filter(
              (cb) =>
                (cb.authorizedUIDs && cb.authorizedUIDs[currentUser.uid]) ||
                cb.createdBy === currentUser.uid
            );
            console.log("🏪 [useStores] Bases acessíveis após filtro:", {
              accessibleCount: accessibleClientBases.length,
              bases: accessibleClientBases.map((cb) => ({
                id: cb.id,
                name: cb.name,
              })),
            });
          }

          const finalBases = accessibleClientBases.map(
            (cb: ClientBase): Base => ({
              id: cb.id,
              name: cb.name,
              createdAt: cb.createdAt,
              numberId: cb.numberId,
              ativo: cb.ativo,
            })
          );

          console.log("🏪 [useStores] Bases finais sendo definidas:", {
            finalBasesCount: finalBases.length,
            bases: finalBases.map((b) => ({ id: b.id, name: b.name })),
          });

          setBases(finalBases);
        } else {
          console.log("🏪 [useStores] Nenhum dado encontrado - limpando bases");
          setBases([]);
        }
      },
      (error) => {
        console.error("[useStores] Erro ao carregar clientBases:", error);
        setBases([]);
      }
    );

    return () => unsubscribeBases();
  }, [currentUser]);

  const fetchDataForBase = useCallback(
    (
      path: string,
      setter: React.Dispatch<React.SetStateAction<any[]>>,
      orderBy: string = "name"
    ) => {
      if (!currentUser || !selectedBaseId) {
        setter([]);
        return () => {};
      }
      const dataRef = ref(db, `clientBases/${selectedBaseId}/${path}`);
      const dataQuery = query(dataRef, orderByChild(orderBy));
      const unsubscribe = onValue(
        dataQuery,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const list = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
            setter(list);
          } else {
            setter([]);
          }
        },
        (error) => {
          console.error(`[useStores] Erro ao carregar ${path}:`, error);
          setter([]);
        }
      );
      return unsubscribe;
    },
    [currentUser, selectedBaseId]
  );

  useEffect(() => fetchDataForBase("appStores", setStores), [fetchDataForBase]);
  useEffect(
    () => fetchDataForBase("appPaymentMethods", setPaymentMethods),
    [fetchDataForBase]
  );
  useEffect(
    () => fetchDataForBase("appMovementTypes", setMovementTypes),
    [fetchDataForBase]
  );
  useEffect(
    () => fetchDataForBase("appGoals", setGoals, "targetDate"),
    [fetchDataForBase]
  );

  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      setClosings([]);
      return;
    }
    const closingsRef = ref(db, `clientBases/${selectedBaseId}/appClosings`);
    const closingsQuery = query(closingsRef, orderByChild("closingDate"));
    const unsubscribe = onValue(closingsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: StoreClosing[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          closingDate: new Date(data[key].closingDate),
          createdAt: new Date(data[key].createdAt),
          movements: data[key].movements
            ? Array.isArray(data[key].movements)
              ? data[key].movements
              : Object.values(data[key].movements)
            : [],
        }));
        setClosings(list);
      } else {
        setClosings([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser, selectedBaseId]);

  function calculateTotals(movements) {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalOutros = 0;
    movements.forEach((m) => {
      if (m.transactionType === "Receita")
        totalEntradas += m.amount - (m.discount || 0);
      else if (m.transactionType === "Despesa") totalSaidas += m.amount;
      else totalOutros += m.amount;
    });
    const netResult = totalEntradas - totalSaidas;
    return { totalEntradas, totalSaidas, totalOutros, netResult };
  }

  const addStore = async (
    storeData: Omit<Store, "id" | "createdAt" | "baseId">
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
      const storesNodeRef = ref(db, `clientBases/${selectedBaseId}/appStores`);
      const newStoreRef = push(storesNodeRef);
      const storeToSave = {
        ...storeData,
        baseId: selectedBaseId,
        createdAt: serverTimestamp(),
      };
      await set(newStoreRef, storeToSave);
      return {
        id: newStoreRef.key!,
        ...storeToSave,
        createdAt: new Date(),
      } as Store;
    } catch (error) {
      console.error("[useStores] Erro ao adicionar loja:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível adicionar a loja.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStore = async (
    id: string,
    storeUpdates: Partial<Omit<Store, "id" | "createdAt" | "baseId">>
  ) => {
    const storeToUpdate = stores.find((s) => s.id === id);
    if (!currentUser || !storeToUpdate?.baseId) {
      toast({
        title: "Erro!",
        description: "Loja inválida ou sem permissão.",
        variant: "destructive",
      });
      return;
    }
    try {
      const storeRef = ref(
        db,
        `clientBases/${storeToUpdate.baseId}/appStores/${id}`
      );
      await update(storeRef, storeUpdates);
      toast({
        title: "Sucesso!",
        description: "Loja atualizada.",
        variant: "success",
      });
    } catch (error) {
      console.error("[useStores] Erro ao atualizar loja:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar a loja.",
        variant: "destructive",
      });
    }
  };

  const deleteStore = async (id: string) => {
    const storeToDelete = stores.find((s) => s.id === id);
    if (!currentUser || !storeToDelete?.baseId) {
      toast({
        title: "Erro!",
        description: "Loja inválida ou sem permissão.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { baseId } = storeToDelete;
      await remove(ref(db, `clientBases/${baseId}/appStores/${id}`));

      const relatedDataPaths = ["appClosings", "appGoals"];
      relatedDataPaths.forEach((path) => {
        const q = query(
          ref(db, `clientBases/${baseId}/${path}`),
          orderByChild("storeId"),
          equalTo(id)
        );
        onValue(
          q,
          (snapshot) => {
            snapshot.forEach((child) => remove(child.ref));
          },
          { onlyOnce: true }
        );
      });

      toast({
        title: "Sucesso!",
        description: "Loja e dados associados deletados.",
        variant: "success",
      });
    } catch (error) {
      console.error("[useStores] Erro ao deletar loja:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível deletar a loja.",
        variant: "destructive",
      });
    }
  };

  const closingsWithDetails = useMemo(() => {
    const storesMap = new Map(stores.map((s) => [s.id, s]));
    const paymentMethodsMap = new Map(paymentMethods.map((p) => [p.id, p]));

    return closings.map((closing) => ({
      ...closing,
      store: storesMap.get(closing.storeId),
      movements: (closing.movements || []).map((movement: MovementItem) => ({
        ...movement,
        paymentMethod: paymentMethodsMap.get(movement.paymentMethodId),
      })),
    }));
  }, [closings, stores, paymentMethods]);

  const generateDRE = useCallback(
    (startDate: Date, endDate: Date, storeId?: string): DREData => {
      const filteredClosings = closings.filter((closing) => {
        const closingDate = new Date(closing.closingDate);
        return (
          (!storeId || closing.storeId === storeId) &&
          closingDate >= startDate &&
          closingDate <= endDate
        );
      });

      const storesToProcess = storeId
        ? stores.filter((s) => s.id === storeId)
        : stores;

      const storeResults = storesToProcess
        .map((store) => {
          const storeClosings = filteredClosings.filter(
            (c) => c.storeId === store.id
          );
          const totalReceitas = storeClosings.reduce(
            (sum, c) => sum + c.totalEntradas,
            0
          );
          const totalDespesas = storeClosings.reduce(
            (sum, c) => sum + c.totalSaidas,
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
        .filter((sr) => sr.closings.length > 0);

      const consolidated = storeResults.reduce(
        (acc, result) => ({
          totalReceitas: acc.totalReceitas + result.totalReceitas,
          totalDespesas: acc.totalDespesas + result.totalDespesas,
          resultadoLiquido: acc.resultadoLiquido + result.resultadoLiquido,
        }),
        { totalReceitas: 0, totalDespesas: 0, resultadoLiquido: 0 }
      );

      return {
        period: `${startDate.toLocaleDateString(
          "pt-BR"
        )} - ${endDate.toLocaleDateString("pt-BR")}`,
        stores: storeResults,
        consolidated,
      };
    },
    [closings, stores]
  );

  const createCrudFunctions = <T extends { id: string }>(
    path: string,
    entityName: string
  ) => {
    const add = async (data: Omit<T, "id" | "createdAt">) => {
      if (!currentUser || !selectedBaseId) {
        toast({
          title: "Erro!",
          description: `Usuário não autenticado ou base não selecionada para adicionar ${entityName}.`,
          variant: "destructive",
        });
        return null;
      }
      try {
        const nodeRef = ref(db, `clientBases/${selectedBaseId}/${path}`);
        const newRef = push(nodeRef);
        await set(newRef, { ...data, createdAt: serverTimestamp() });
        toast({
          title: "Sucesso!",
          description: `${entityName} adicionado(a).`,
          variant: "success",
        });
        return { id: newRef.key!, ...data, createdAt: new Date() } as T;
      } catch (error) {
        console.error(`[useStores] Erro ao adicionar ${entityName}:`, error);
        toast({
          title: "Erro!",
          description: `Não foi possível adicionar ${entityName}.`,
          variant: "destructive",
        });
        return null;
      }
    };

    const updateItem = async (
      id: string,
      updates: Partial<Omit<T, "id" | "createdAt">>
    ) => {
      if (!currentUser || !selectedBaseId) {
        toast({
          title: "Erro!",
          description: `Usuário não autenticado ou base não selecionada para atualizar ${entityName}.`,
          variant: "destructive",
        });
        return;
      }
      try {
        const itemRef = ref(db, `clientBases/${selectedBaseId}/${path}/${id}`);
        await update(itemRef, updates);
        toast({
          title: "Sucesso!",
          description: `${entityName} atualizado(a).`,
          variant: "success",
        });
      } catch (error) {
        console.error(`[useStores] Erro ao atualizar ${entityName}:`, error);
        toast({
          title: "Erro!",
          description: `Não foi possível atualizar ${entityName}.`,
          variant: "destructive",
        });
      }
    };

    const remove_ = async (id: string) => {
      if (!currentUser || !selectedBaseId) {
        toast({
          title: "Erro!",
          description: `Usuário não autenticado ou base não selecionada para remover ${entityName}.`,
          variant: "destructive",
        });
        return;
      }
      try {
        const itemRef = ref(db, `clientBases/${selectedBaseId}/${path}/${id}`);
        await remove(itemRef);
        toast({
          title: "Sucesso!",
          description: `${entityName} removido(a).`,
          variant: "success",
        });
      } catch (error) {
        console.error(`[useStores] Erro ao remover ${entityName}:`, error);
        toast({
          title: "Erro!",
          description: `Não foi possível remover ${entityName}.`,
          variant: "destructive",
        });
      }
    };

    return { add, update: updateItem, remove: remove_ };
  };

  const {
    add: addPaymentMethod,
    update: updatePaymentMethod,
    remove: deletePaymentMethod,
  } = createCrudFunctions<PaymentMethod>(
    "appPaymentMethods",
    "Método de Pagamento"
  );
  const {
    add: addMovementType,
    update: updateMovementType,
    remove: deleteMovementType,
  } = createCrudFunctions<MovementType>(
    "appMovementTypes",
    "Tipo de Movimento"
  );

  const addStoreClosing = async (
    closingData: Omit<
      StoreClosing,
      | "id"
      | "createdAt"
      | "totalEntradas"
      | "totalSaidas"
      | "totalOutros"
      | "netResult"
    >
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
      const closingsNodeRef = ref(
        db,
        `clientBases/${selectedBaseId}/appClosings`
      );
      const newClosingRef = push(closingsNodeRef);
      const { totalEntradas, totalSaidas, totalOutros } = calculateTotals(
        closingData.movements || []
      );
      const netResult =
        (closingData.finalBalance || 0) - (closingData.initialBalance || 0);

      const closingToSave = {
        ...closingData,
        closingDate: closingData.closingDate.toISOString(),
        totalEntradas,
        totalSaidas,
        totalOutros,
        netResult,
        createdAt: serverTimestamp(),
      };
      await set(newClosingRef, closingToSave);
      return {
        ...closingToSave,
        id: newClosingRef.key!,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("[useStores] Erro ao adicionar fechamento:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível adicionar o fechamento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateClosing = async (
    id: string,
    closingUpdates: Partial<Omit<StoreClosing, "id" | "createdAt">>
  ) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const closingRef = ref(
        db,
        `clientBases/${selectedBaseId}/appClosings/${id}`
      );
      const updatesToSave: Record<string, any> = { ...closingUpdates };

      if (closingUpdates.closingDate) {
        updatesToSave.closingDate = closingUpdates.closingDate.toISOString();
      }

      if (closingUpdates.movements) {
        const { totalEntradas, totalSaidas, totalOutros } = calculateTotals(
          closingUpdates.movements
        );
        updatesToSave.totalEntradas = totalEntradas;
        updatesToSave.totalSaidas = totalSaidas;
        updatesToSave.totalOutros = totalOutros;

        const snapshot = await get(closingRef);
        const currentClosingData = snapshot.val();

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
      toast({ title: "Sucesso!", description: "Fechamento atualizado." });
    } catch (error) {
      console.error("[useStores] Erro ao atualizar fechamento:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar o fechamento.",
        variant: "destructive",
      });
    }
  };

  const deleteClosing = async (id: string) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Ação não permitida.",
        variant: "destructive",
      });
      return;
    }
    try {
      const closingRef = ref(
        db,
        `clientBases/${selectedBaseId}/appClosings/${id}`
      );
      await remove(closingRef);
    } catch (error) {
      console.error("[useStores] Erro ao deletar fechamento:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível deletar o fechamento.",
        variant: "destructive",
      });
    }
  };

  const addGoal = async (goalData: Omit<StoreMeta, "id" | "createdAt">) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Ação não permitida.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const goalsNodeRef = ref(db, `clientBases/${selectedBaseId}/appGoals`);
      const newGoalRef = push(goalsNodeRef);
      const goalToSave = {
        ...goalData,
        createdAt: serverTimestamp(),
        targetDate: goalData.targetDate
          ? goalData.targetDate.toISOString()
          : null,
      };
      await set(newGoalRef, goalToSave);
      toast({ title: "Sucesso!", description: "Meta adicionada." });
      return { ...goalData, id: newGoalRef.key!, createdAt: new Date() };
    } catch (error) {
      console.error("Erro ao adicionar meta:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível adicionar a meta.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateGoal = async (
    id: string,
    goalUpdates: Partial<Omit<StoreMeta, "id" | "createdAt">>
  ) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Ação não permitida.",
        variant: "destructive",
      });
      return;
    }
    try {
      const goalRef = ref(db, `clientBases/${selectedBaseId}/appGoals/${id}`);
      const updatesToSave: Record<string, any> = { ...goalUpdates };
      if (goalUpdates.targetDate) {
        updatesToSave.targetDate = goalUpdates.targetDate.toISOString();
      }
      await update(goalRef, updatesToSave);
      toast({ title: "Sucesso!", description: "Meta atualizada." });
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Ação não permitida.",
        variant: "destructive",
      });
      return;
    }
    try {
      const goalRef = ref(db, `clientBases/${selectedBaseId}/appGoals/${id}`);
      await remove(goalRef);
      toast({ title: "Sucesso!", description: "Meta deletada." });
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível deletar a meta.",
        variant: "destructive",
      });
    }
  };

  const storeRankings = useMemo((): StoreRanking[] => {
    return stores.map((store) => {
      const storeClosings = closings.filter((c) => c.storeId === store.id);
      const totalClosings = storeClosings.length;
      if (totalClosings === 0) {
        return {
          store,
          totalClosings: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          averageBalance: 0,
          lastClosingDate: undefined,
        };
      }
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
        (totalInitialBalance + totalFinalBalance) / (totalClosings * 2);

      const lastClosingDate = new Date(
        Math.max(...storeClosings.map((c) => new Date(c.closingDate).getTime()))
      );

      return {
        store,
        totalClosings,
        totalRevenue,
        totalExpenses,
        averageBalance,
        lastClosingDate,
      };
    });
  }, [stores, closings]);

  return {
    bases,
    stores,
    closings: closingsWithDetails,
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
    storeRankings,
  };
};
