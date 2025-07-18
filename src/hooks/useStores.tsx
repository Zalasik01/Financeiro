import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";
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
import { useCallback, useEffect, useMemo, useState } from "react";

// Função utilitária para garantir que o usuário autenticado tenha registro na tabela 'usuario'
async function ensureUsuarioRecord(user: any, toast: any) {
  if (!user) return;
  // Verifica se já existe registro na tabela 'usuario' com o mesmo uuid do usuário autenticado
  const { data, error } = await supabase
    .from("usuario")
    .select("uuid")
    .eq("uuid", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    toast({
      title: "Erro ao verificar usuário",
      description: error.message,
      variant: "destructive",
    });
    return;
  }
  if (!data) {
    // Cria registro mínimo na tabela usuario
    const { error: insertError } = await supabase.from("usuario").insert([
      {
        uuid: user.id,
        email: user.email,
        nome: user.user_metadata?.name || user.email,
        criado_em: new Date().toISOString(),
      },
    ]);
    if (insertError) {
      toast({
        title: "Erro ao criar registro de usuário",
        description: insertError.message,
        variant: "destructive",
      });
    }
  }
}

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
      setBases([]);
      return;
    }
    // Garante que o usuário autenticado tenha registro na tabela 'usuario'
    ensureUsuarioRecord(currentUser, toast);
    // Buscar bases do Supabase
    const fetchBases = async () => {
      const { data, error } = await supabase
        .from("base_cliente")
        .select(
          "id, nome, criado_em, ativa, limite_acesso, id_criador, motivo_inativa"
        );
      if (error) {
        toast({
          title: "Erro ao carregar bases",
          description: error.message,
          variant: "destructive",
        });
        setBases([]);
        return;
      }
      if (!data) {
        setBases([]);
        return;
      }
      // Ajusta para o tipo correto, já que nome do campo mudou
      let allClientBases: ClientBase[] =
        data?.map((b: any) => ({
          id: b.id,
          name: b.nome,
          nome: b.nome,
          createdAt: b.criado_em,
          criado_em: b.criado_em,
          ativo: b.ativa,
          ativa: b.ativa,
          numberId: b.id, // Usando id como numberId já que não há campo numberId separado
          createdBy: b.id_criador,
          id_criador: b.id_criador,
          authorizedUIDs: {}, // Campo não existe na tabela atual, usando objeto vazio
          limite_acesso: b.limite_acesso,
          motivo_inativa: b.motivo_inativa,
        })) ?? [];
      let accessibleClientBases: ClientBase[];
      if (currentUser.isAdmin) {
        accessibleClientBases = allClientBases;
      } else {
        accessibleClientBases = allClientBases.filter((cb) => {
          const hasAuthorizedUID =
            cb.authorizedUIDs && cb.authorizedUIDs[currentUser.id];
          const isCreatedByUser = cb.createdBy === currentUser.id;
          return hasAuthorizedUID || isCreatedByUser;
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
      setBases(finalBases);
    };
    fetchBases();
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
      const fetchData = async () => {
        const { data, error } = await supabase
          .from(`${path}`)
          .select("*")
          .eq("baseId", selectedBaseId)
          .order(orderBy, { ascending: true });
        if (error) {
          setter([]);
          return;
        }
        setter(data || []);
      };
      fetchData();
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
    const fetchClosings = async () => {
      const { data, error } = await supabase
        .from("appClosings")
        .select("*")
        .eq("baseId", selectedBaseId)
        .order("closingDate", { ascending: true });
      if (error) {
        setClosings([]);
        return;
      }
      setClosings(data || []);
    };
    fetchClosings();
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
      const { data, error } = await supabase
        .from("appStores")
        .insert([
          {
            ...storeData,
            baseId: selectedBaseId,
            createdAt: new Date().toISOString(),
          },
        ])
        .select();
      if (error) {
        throw error;
      }
      return data[0] as Store;
    } catch (error) {
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
      const { error } = await supabase
        .from("appStores")
        .update(storeUpdates)
        .eq("id", id);
      if (error) {
        throw error;
      }
      toast({
        title: "Sucesso!",
        description: "Loja atualizada.",
        variant: "success",
      });
    } catch (error) {
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
      const { error } = await supabase.from("appStores").delete().eq("id", id);
      if (error) {
        throw error;
      }

      const relatedDataPaths = ["appClosings", "appGoals"];
      relatedDataPaths.forEach((path) => {
        supabase
          .from(path)
          .delete()
          .eq("storeId", id)
          .then(() => {})
          .catch(() => {});
      });

      toast({
        title: "Sucesso!",
        description: "Loja e dados associados deletados.",
        variant: "success",
      });
    } catch (error) {
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
        const { data: insertedData, error } = await supabase
          .from(path)
          .insert([{ ...data, createdAt: new Date().toISOString() }])
          .select();
        if (error) {
          throw error;
        }
        toast({
          title: "Sucesso!",
          description: `${entityName} adicionado(a).`,
          variant: "success",
        });
        return { id: insertedData[0].id, ...data, createdAt: new Date() } as T;
      } catch (error) {
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
        const { error } = await supabase
          .from(path)
          .update(updates)
          .eq("id", id);
        if (error) {
          throw error;
        }
        toast({
          title: "Sucesso!",
          description: `${entityName} atualizado(a).`,
          variant: "success",
        });
      } catch (error) {
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
        const { error } = await supabase.from(path).delete().eq("id", id);
        if (error) {
          throw error;
        }
        toast({
          title: "Sucesso!",
          description: `${entityName} removido(a).`,
          variant: "success",
        });
      } catch (error) {
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
      const { data, error } = await supabase
        .from("appClosings")
        .insert([
          {
            ...closingData,
            closingDate: closingData.closingDate.toISOString(),
            createdAt: new Date().toISOString(),
          },
        ])
        .select();
      if (error) {
        throw error;
      }
      return data[0];
    } catch (error) {
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

        const snapshot = await supabase
          .from("appClosings")
          .select("*")
          .eq("id", id)
          .single();
        const currentClosingData = snapshot.data;

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

      const { error } = await supabase
        .from("appClosings")
        .update(updatesToSave)
        .eq("id", id);
      if (error) {
        throw error;
      }
      toast({ title: "Sucesso!", description: "Fechamento atualizado." });
    } catch (error) {
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
      const { error } = await supabase
        .from("appClosings")
        .delete()
        .eq("id", id);
      if (error) {
        throw error;
      }
    } catch (error) {
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
      const { data, error } = await supabase
        .from("appGoals")
        .insert([
          {
            ...goalData,
            createdAt: new Date().toISOString(),
            targetDate: goalData.targetDate
              ? goalData.targetDate.toISOString()
              : null,
          },
        ])
        .select();
      if (error) {
        throw error;
      }
      toast({ title: "Sucesso!", description: "Meta adicionada." });
      return { ...goalData, id: data[0].id, createdAt: new Date() };
    } catch (error) {
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
      const updatesToSave: Record<string, any> = { ...goalUpdates };
      if (goalUpdates.targetDate) {
        updatesToSave.targetDate = goalUpdates.targetDate.toISOString();
      }
      const { error } = await supabase
        .from("appGoals")
        .update(updatesToSave)
        .eq("id", id);
      if (error) {
        throw error;
      }
      toast({ title: "Sucesso!", description: "Meta atualizada." });
    } catch (error) {
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
      const { error } = await supabase.from("appGoals").delete().eq("id", id);
      if (error) {
        throw error;
      }
      toast({ title: "Sucesso!", description: "Meta deletada." });
    } catch (error) {
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
    closings,
    paymentMethods,
    movementTypes,
    goals,
    setBases,
    setStores,
    setClosings,
    setPaymentMethods,
    setMovementTypes,
    setGoals,
  };
};
