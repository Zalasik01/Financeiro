import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Base, // Importar o novo tipo Base
  Store,
  StoreClosing,
  PaymentMethod,
  MovementType,
  MovementItem,
  ClientBase, // Importar ClientBase
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
  const [bases, setBases] = useState<Base[]>([]); // Estado para Bases
  const [stores, setStores] = useState<Store[]>([]);
  const [closings, setClosings] = useState<StoreClosing[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [goals, setGoals] = useState<StoreMeta[]>([]);
  const { currentUser, selectedBaseId } = useAuth(); // Obter o usuário atual e o selectedBaseId
  const { toast } = useToast(); // Inicializar o hook de toast
  // Carregar Bases (appBases para o usuário logado ou clientBases filtradas para não-admins)
  useEffect(() => {
    // Esta linha de log já deve existir no seu arquivo, conforme seus logs anteriores.
    if (!currentUser) {
      setBases([]);
      return;
    }

    // Todos os usuários (admin e não admin) buscarão do nó /clientBases.
    // O filtro será aplicado para não-admins.
    const clientBasesRef = ref(db, "clientBases");
    const unsubscribeBases = onValue(clientBasesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allClientBases: ClientBase[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        let accessibleClientBases: ClientBase[];

        if (currentUser.isAdmin) {
          // Admin vê todas as clientBases
          accessibleClientBases = allClientBases;
        } else if (
          currentUser.clientBaseId !== null &&
          currentUser.clientBaseId !== undefined
        ) {
          // Usuário não-admin COM clientBaseId definido:
          console.log(`[useStores] Filtrando para não-admin ${currentUser.email} com clientBaseId: ${currentUser.clientBaseId}`);
          // Filtra para APENAS essa base. A verificação de authorizedUIDs é removida
          // pois a presença do clientBaseId no perfil do usuário já implica acesso.
          accessibleClientBases = allClientBases.filter(
            (cb) => {
              const match = cb.numberId === currentUser.clientBaseId;
              console.log(`[useStores] Comparando base "${cb.name}" (numberId: ${cb.numberId}, tipo: ${typeof cb.numberId}) com currentUser.clientBaseId (${currentUser.clientBaseId}, tipo: ${typeof currentUser.clientBaseId}). Match: ${match}`);
              return match; // Mantido para depuração, pode ser comentado depois
            }
          );
          console.log("[useStores] Bases acessíveis após filtro por clientBaseId:", accessibleClientBases.map(b => ({ id: b.id, name: b.name, numberId: b.numberId })));
        } else {
          // Usuário não-admin SEM clientBaseId definido:
          // Vê todas as clientBases às quais tem acesso via authorizedUIDs.
          console.log(`[useStores] Filtrando para não-admin ${currentUser.email} SEM clientBaseId, verificando authorizedUIDs.`);
          accessibleClientBases = allClientBases.filter(
            (cb) =>
              cb.authorizedUIDs && // Garante que authorizedUIDs exista
              currentUser.uid &&    // Garante que currentUser.uid exista
              cb.authorizedUIDs[currentUser.uid]
          );
          console.log("[useStores] Bases acessíveis após filtro por authorizedUIDs:", accessibleClientBases.map(b => ({ id: b.id, name: b.name })));
        }
        // Mapear ClientBase para Base para o modal
        setBases(
          accessibleClientBases.map(
            (
              cb: ClientBase
            ): Base => ({
              id: cb.id, // UUID
              name: cb.name,
              createdAt: cb.createdAt,
              numberId: cb.numberId as number, // Assuming Base.numberId is number and cb.numberId might be any
            })
          )
        );
      } else { // Adicionado ponto e vírgula
        setBases([]);
      }
    }, (error) => {
      console.error("[useStores] Erro ao carregar clientBases do Firebase:", error);
      setBases([]); // Limpa as bases em caso de erro
    });

    return () => unsubscribeBases();
  }, [currentUser]);

  // Carregar Lojas (agora associadas a bases)
  useEffect(() => {
    // console.log("[useStores] Entrando no useEffect de carregamento de Lojas. currentUser:", currentUser ? currentUser.email : null, "selectedBaseId:", selectedBaseId);
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      // console.log("[useStores] useEffect para lojas: currentUser ou selectedBaseId é null/undefined. Limpando lojas.");
      setStores([]);
      return;
    }
    // console.log(
    //   "[useStores] Configurando listener para lojas. selectedBaseId:",
    //   selectedBaseId
    // ); 
    const storesPath = `clientBases/${selectedBaseId}/appStores`; // Caminho atualizado
    const storesNodeRef = ref(db, storesPath);
    const storesQuery = query(storesNodeRef, orderByChild("name"));
    const unsubscribe = onValue(storesQuery, (snapshot) => {
      // console.log(
      //   "[useStores] Snapshot de lojas recebido. Caminho:",
      //   storesPath,
      //   "Valor:",
      //   snapshot.val()
      // ); 
      // console.log("[useStores] Snapshot recebido para lojas:", snapshot.val());
      const data = snapshot.val();
      if (data) {
        const list: Store[] = Object.keys(data).map((key) => {
          const storeEntry = data[key];
          let createdAtValue: Date;
          if (
            storeEntry.createdAt &&
            (typeof storeEntry.createdAt === "number" ||
              typeof storeEntry.createdAt === "string")
          ) {
            createdAtValue = new Date(storeEntry.createdAt);
          } else {
            // Fallback para data atual se createdAt for inválido ou ausente
            createdAtValue = new Date();
          }
          return {
            id: key,
            ...storeEntry,
            createdAt: createdAtValue, // Agora é um objeto Date
            baseId: storeEntry.baseId, // Garantir que baseId seja carregado
          };
        });
        // console.log("[useStores] Nova lista de lojas para o estado:", list); 
        // console.log("[useStores] Lista de lojas processada:", list);
        setStores(list);
      } else {
        // console.log(
        //   "[useStores] Nenhum dado de loja encontrado no Firebase para o selectedBaseId:",
        //   selectedBaseId
        // ); 
        setStores([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser, selectedBaseId]);

  // Carregar Métodos de Pagamento
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      setPaymentMethods([]);
      return;
    }
    const methodsPath = `clientBases/${selectedBaseId}/appPaymentMethods`; // Caminho atualizado
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
  }, [currentUser, selectedBaseId]);

  // Carregar Tipos de Movimento
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      setMovementTypes([]);
      return;
    }
    const typesPath = `clientBases/${selectedBaseId}/appMovementTypes`; // Caminho atualizado
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
  }, [currentUser, selectedBaseId]);

  // Carregar Fechamentos (Closings)
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      setClosings([]);
      return;
    }
    const closingsPath = `clientBases/${selectedBaseId}/appClosings`; // Caminho atualizado
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
          movements: data[key].movements // Firebase RTDB normalmente retorna um array se um array foi salvo.
            ? Array.isArray(data[key].movements)
              ? data[key].movements // Usa diretamente se for um array
              : Object.values(data[key].movements) // Fallback para objetos que se parecem com arrays (ex: chaves "0", "1")
            : [], // Define como array vazio se não houver movements
        }));
        setClosings(list);
      } else {
        setClosings([]);
      }
    });
    return () => unsubscribe();
  }, [currentUser, selectedBaseId]);

  // Carregar Metas (Goals)
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      // Precisa de um selectedBaseId
      setGoals([]);
      return;
    }
    const goalsPath = `clientBases/${selectedBaseId}/appGoals`; // Caminho atualizado
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
  }, [currentUser, selectedBaseId]);

  // Modificar addStore para aceitar baseId
  const addStore = async (
    storeData: Omit<Store, "id" | "createdAt" | "baseId">
  ) => {
    if (!currentUser || !selectedBaseId) {
      // Usar selectedBaseId do hook
      toast({
        title: "Erro!",
        description:
          "Usuário não autenticado ou base não selecionada para adicionar loja.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const storesNodeRef = ref(db, `clientBases/${selectedBaseId}/appStores`); // Usar selectedBaseId
      const newStoreRef = push(storesNodeRef);
      const preparedStoreData = {
        ...storeData,
        nickname: storeData.nickname || null,
        code: storeData.code || null,
      };
      const storeToSave = {
        ...preparedStoreData,
        baseId: selectedBaseId, // Adicionar selectedBaseId como baseId da loja
        createdAt: serverTimestamp(),
      };

      await set(newStoreRef, storeToSave);
      // Retornar a loja com o ID gerado e createdAt como número (timestamp) ou objeto Date
      // Para consistência com serverTimestamp, o ideal seria buscar o valor após salvar,
      // mas para simplificar, retornamos uma aproximação ou o objeto que o Firebase usa.
      return {
        ...storeData,
        id: newStoreRef.key!,
        baseId: selectedBaseId,
        // createdAt será preenchido pelo serverTimestamp, new Date() é uma aproximação local
        createdAt: Date.now(), // Ou deixe como undefined e confie no listener para atualizar
      } as unknown as Store; // Usar unknown para depois forçar o tipo Store
    } catch (errorUnknown: unknown) {
      const firebaseError = errorUnknown as Error & { code?: string }; // Adiciona code opcional
      if (firebaseError.code) {
        console.error(
          "[useStores] Código de erro do Firebase:",
          firebaseError.code
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

  // Funções updateBase e deleteBase precisariam ser implementadas similarmente
  // ...

  const updateStore = async (
    id: string,
    storeUpdates: Partial<Omit<Store, "id" | "createdAt">>
  ) => {
    const storeToUpdate = stores.find((s) => s.id === id);
    if (!currentUser || !storeToUpdate || !storeToUpdate.baseId) {
      toast({
        title: "Erro!",
        description:
          "Usuário não autenticado, loja não encontrada ou ID da base da loja ausente.",
        variant: "destructive",
      });
      return;
    }
    const clientBaseId = storeToUpdate.baseId; // Este é o clientBaseId

    try {
      const storeRef = ref(db, `clientBases/${clientBaseId}/appStores/${id}`); // Caminho atualizado
      await update(storeRef, storeUpdates);
      // Opcional: toast de sucesso
      toast({ title: "Sucesso!", description: "Loja atualizada.", variant: "success", });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível atualizar a loja.";
      console.error("Erro ao atualizar loja:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteStore = async (id: string) => {
    const storeToDelete = stores.find((s) => s.id === id);
    if (!currentUser || !storeToDelete || !storeToDelete.baseId) {
      toast({
        title: "Erro!",
        description:
          "Usuário não autenticado, loja não encontrada ou ID da base da loja ausente.",
        variant: "destructive",
      });
      return;
    }
    const clientBaseId = storeToDelete.baseId; // Este é o clientBaseId

    try {
      const storeRef = ref(db, `clientBases/${clientBaseId}/appStores/${id}`); // Caminho atualizado
      await remove(storeRef);

      // Remover fechamentos e metas associados
      const closingsQuery = query(
        ref(db, `clientBases/${clientBaseId}/appClosings`), // Caminho atualizado
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
        ref(db, `clientBases/${clientBaseId}/appGoals`), // Caminho atualizado
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
      // Opcional: toast de sucesso
      toast({
        title: "Sucesso!",
        description: "Loja e dados associados deletados.",
      });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível deletar a loja.";
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const methodsNodeRef = ref(
        db,
        `clientBases/${selectedBaseId}/appPaymentMethods`
      ); // Caminho atualizado
      const newMethodRef = push(methodsNodeRef);
      const methodToSave = { ...methodData, createdAt: serverTimestamp() };
      await set(newMethodRef, methodToSave);
      toast({
        title: "Sucesso!",
        description: "Método de pagamento adicionado.",
      });
      return { ...methodData, id: newMethodRef.key!, createdAt: new Date() };
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message ||
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const methodRef = ref(
        db,
        `clientBases/${selectedBaseId}/appPaymentMethods/${id}`
      ); // Caminho atualizado
      await update(methodRef, methodUpdates);
      toast({
        title: "Sucesso!",
        description: "Método de pagamento atualizado.",
      });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message ||
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const methodRef = ref(
        db,
        `clientBases/${selectedBaseId}/appPaymentMethods/${id}`
      ); // Caminho atualizado
      await remove(methodRef);
      toast({
        title: "Sucesso!",
        description: "Método de pagamento deletado.",
      });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message ||
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const typesNodeRef = ref(
        db,
        `clientBases/${selectedBaseId}/appMovementTypes`
      ); // Caminho atualizado
      const newTypeRef = push(typesNodeRef);
      const typeToSave = { ...typeData, createdAt: serverTimestamp() };
      await set(newTypeRef, typeToSave);
      toast({
        title: "Sucesso!",
        description: "Tipo de movimento adicionado.",
      });
      return { ...typeData, id: newTypeRef.key!, createdAt: new Date() };
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message ||
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const typeRef = ref(
        db,
        `clientBases/${selectedBaseId}/appMovementTypes/${id}`
      ); // Caminho atualizado
      await update(typeRef, typeUpdates);
      toast({
        title: "Sucesso!",
        description: "Tipo de movimento atualizado.",
      });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message ||
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const typeRef = ref(
        db,
        `clientBases/${selectedBaseId}/appMovementTypes/${id}`
      ); // Caminho atualizado
      await remove(typeRef);
      toast({ title: "Sucesso!", description: "Tipo de movimento deletado." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message ||
        "Não foi possível deletar o tipo de movimento.";
      console.error("Erro ao deletar tipo de movimento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // movementTypeMap não é mais necessário para este fluxo se MovementItem usa transactionType
  // const movementTypeMap = useMemo(() => {
  //   return new Map(movementTypes.map((type) => [type.id, type]));
  // }, [movementTypes]);

  const calculateTotals = useCallback(
    (movements: MovementItem[]) => {
      const totalEntradas = movements
        .filter((m) => m.transactionType === "Receita")
        .reduce((sum, m) => sum + m.amount - (m.discount || 0), 0);

      const totalSaidas = movements
        .filter((m) => m.transactionType === "Despesa")
        .reduce((sum, m) => sum + m.amount, 0);

      const totalOutros = 0; // Movimentações de transações financeiras não geram "outros"

      return { totalEntradas, totalSaidas, totalOutros };
    },
    [] // Removida dependência de movementTypeMap
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
      ); // Caminho atualizado
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
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível adicionar o fechamento.";
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
      ); // Caminho atualizado
      const updatesToSave: Partial<StoreClosing> = { ...closingUpdates }; // Tipagem mais específica

      if (closingUpdates.closingDate) {
        (updatesToSave as Record<string, unknown>).closingDate =
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

        let currentClosingData: StoreClosing | undefined | null; // Tipagem mais precisa
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
      toast({ title: "Sucesso!", description: "Fechamento atualizado." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível atualizar o fechamento.";
      console.error("Erro ao atualizar fechamento:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteClosing = async (id: string) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Você precisa estar logado para deletar um fechamento.",
        variant: "destructive",
      });
      return;
    }
    try {
      const closingRef = ref(
        db,
        `clientBases/${selectedBaseId}/appClosings/${id}`
      ); // Caminho atualizado
      await remove(closingRef);
      toast({ title: "Sucesso!", description: "Fechamento deletado." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível deletar o fechamento.";
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
        paymentMethod: paymentMethods.find(
          (method) => method.id === movement.paymentMethodId
        ),
      })),
    }));
  }, [closings, stores, paymentMethods]); // Removido movementTypes da dependência

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
      // Assuming filteredStores is Store[]
      .map((store: Store) => {
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const goalsNodeRef = ref(db, `clientBases/${selectedBaseId}/appGoals`); // Caminho atualizado
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
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível adicionar a meta.";
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
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const goalRef = ref(db, `clientBases/${selectedBaseId}/appGoals/${id}`); // Caminho atualizado
      const updatesToSave: Record<string, unknown> = { ...goalUpdates };
      if (goalUpdates.targetDate) {
        updatesToSave.targetDate = goalUpdates.targetDate.toISOString();
      }
      await update(goalRef, updatesToSave);
      toast({ title: "Sucesso!", description: "Meta atualizada." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível atualizar a meta.";
      console.error("Erro ao atualizar meta:", error);
      toast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!currentUser || !selectedBaseId) {
      toast({
        title: "Erro!",
        description: "Usuário não autenticado ou base não selecionada.",
        variant: "destructive",
      });
      return;
    }
    try {
      const goalRef = ref(db, `clientBases/${selectedBaseId}/appGoals/${id}`); // Caminho atualizado
      await remove(goalRef);
      toast({ title: "Sucesso!", description: "Meta deletada." });
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as Error;
      const errorMessage = error.message || "Não foi possível deletar a meta.";
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
        (a: StoreClosing, b: StoreClosing) =>
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
    bases, // Retornar bases
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
