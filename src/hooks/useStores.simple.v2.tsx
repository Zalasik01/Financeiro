import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";
import { Base, ClientBase } from "@/types/store";
import { useEffect, useState } from "react";

export const useStores = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [bases, setBases] = useState<Base[]>([]);
  const [basesLoaded, setBasesLoaded] = useState(false);
  const [stores, setStores] = useState([]);
  const [storeRankings, setStoreRankings] = useState([]);
  const [closings, setClosings] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [movementTypes, setMovementTypes] = useState([]);

  // Buscar bases
  useEffect(() => {
    if (!currentUser) {
      setBases([]);
      setBasesLoaded(true);
      return;
    }

    const fetchBases = async () => {
      try {
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
          setBasesLoaded(true);
          return;
        }

        if (!data) {
          setBases([]);
          setBasesLoaded(true);
          return;
        }

        const allClientBases: ClientBase[] =
          data?.map((b: any) => ({
            id: b.id,
            name: b.nome,
            nome: b.nome,
            createdAt: b.criado_em,
            criado_em: b.criado_em,
            ativo: b.ativa,
            ativa: b.ativa,
            numberId: b.id,
            createdBy: b.id_criador,
            id_criador: b.id_criador,
            authorizedUIDs: {},
            limite_acesso: b.limite_acesso,
            motivo_inativa: b.motivo_inativa,
          })) ?? [];

        let accessibleClientBases: ClientBase[];
        if (currentUser?.admin) {
          accessibleClientBases = allClientBases;
        } else {
          accessibleClientBases = allClientBases.filter((cb) => {
            const hasAuthorizedUID =
              cb.authorizedUIDs && cb.authorizedUIDs[currentUser?.id || ""];
            const isCreatedByUser = cb.createdBy === currentUser?.id;
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
        setBasesLoaded(true);
      } catch (err) {
        console.error("Erro ao buscar bases:", err);
        setBases([]);
        setBasesLoaded(true);
      }
    };

    fetchBases();
  }, [currentUser, toast]);

  return {
    bases,
    basesLoaded,
    stores,
    storeRankings,
    closings,
    paymentMethods,
    movementTypes,
    // Funções para compatibilidade - retornam promises vazias
    addStore: () => Promise.resolve({} as any),
    updateStore: () => Promise.resolve({} as any),
    deleteStore: () => Promise.resolve(),
    addClosing: () => Promise.resolve({} as any),
    updateClosing: () => Promise.resolve({} as any),
    deleteClosing: () => Promise.resolve(),
    addGoal: () => Promise.resolve({} as any),
    updateGoal: () => Promise.resolve({} as any),
    deleteGoal: () => Promise.resolve(),
    addStoreClosing: () => Promise.resolve({} as any),
    generateDRE: () => Promise.resolve({} as any),
  };
};
