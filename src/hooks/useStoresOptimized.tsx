import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { Store } from "@/types/store";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/errorHandler";
import { APP_CONFIG } from "@/config/app";

export const useStoresOptimized = (userId: string) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Queries memoizadas para evitar recriação
  const storesQuery = useMemo(() => {
    if (!userId) return null;
    return query(
      collection(db, "stores"),
      where("userId", "==", userId),
      orderBy("name")
    );
  }, [userId]);

  // Efeito otimizado com cleanup
  useEffect(() => {
    if (!storesQuery) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      storesQuery,
      (snapshot) => {
        try {
          const storesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Store));
          
          setStores(storesData);
          setError(null);
        } catch (err) {
          const errorMessage = handleError(err);
          setError(errorMessage);
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage = handleError(err);
        setError(errorMessage);
        setLoading(false);
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  }, [storesQuery, toast]);

  // Stores ativas memoizadas
  const activeStores = useMemo(() => 
    stores.filter(store => store.ativo),
    [stores]
  );

  // Store padrão memoizada
  const defaultStore = useMemo(() => 
    stores.find(store => store.isDefault),
    [stores]
  );

  // Mapa de stores para lookup rápido
  const storesMap = useMemo(() => 
    new Map(stores.map(store => [store.id, store])),
    [stores]
  );

  // Função para adicionar store com validação
  const addStore = async (storeData: Omit<Store, "id">) => {
    try {
      if (!userId) throw new Error("Usuário não autenticado");
      
      if (stores.length >= APP_CONFIG.finance.maxCategoriesPerBase) {
        throw new Error(`Limite de ${APP_CONFIG.finance.maxCategoriesPerBase} lojas atingido`);
      }

      await addDoc(collection(db, "stores"), {
        ...storeData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      toast({
        title: "Sucesso",
        description: "Loja adicionada com sucesso!",
      });
    } catch (error) {
      const errorMessage = handleError(error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função para atualizar store
  const updateStore = async (id: string, storeData: Partial<Store>) => {
    try {
      await updateDoc(doc(db, "stores", id), {
        ...storeData,
        updatedAt: new Date(),
      });
      
      toast({
        title: "Sucesso",
        description: "Loja atualizada com sucesso!",
      });
    } catch (error) {
      const errorMessage = handleError(error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função para deletar store
  const deleteStore = async (id: string) => {
    try {
      await deleteDoc(doc(db, "stores", id));
      
      toast({
        title: "Sucesso",
        description: "Loja excluída com sucesso!",
      });
    } catch (error) {
      const errorMessage = handleError(error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função para buscar store por ID (usando o mapa)
  const getStoreById = (id: string) => storesMap.get(id);

  // Estatísticas memoizadas
  const stats = useMemo(() => ({
    total: stores.length,
    active: activeStores.length,
    inactive: stores.length - activeStores.length,
    hasDefault: !!defaultStore,
  }), [stores.length, activeStores.length, defaultStore]);

  return {
    stores,
    activeStores,
    defaultStore,
    storesMap,
    loading,
    error,
    stats,
    addStore,
    updateStore,
    deleteStore,
    getStoreById,
  };
};
