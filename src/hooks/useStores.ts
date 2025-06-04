import { useState } from "react";
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
import * as defaultDataModule from "@/data/defaultData"; // Importar o módulo como um objeto

export const useStores = () => {
  // Acessar as exportações de forma segura, usando um array vazio como fallback
  const [stores, setStores] = useState<Store[]>(
    (defaultDataModule as any).defaultStores || []
  );
  const [closings, setClosings] = useState<StoreClosing[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    (defaultDataModule as any).defaultPaymentMethods || []
  );
  const [movementTypes, setMovementTypes] = useState<MovementType[]>(
    (defaultDataModule as any).defaultMovementTypes || []
  );
  const [goals, setGoals] = useState<StoreMeta[]>([]);

  const addStore = (store: Omit<Store, "id" | "createdAt">) => {
    const newStore: Store = {
      ...store,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setStores((prev) => [...prev, newStore]);
    return newStore;
  };

  const updateStore = (id: string, storeUpdates: Partial<Store>) => {
    setStores((prev) =>
      prev.map((store) =>
        store.id === id ? { ...store, ...storeUpdates } : store
      )
    );
  };

  const deleteStore = (id: string) => {
    setStores((prev) => prev.filter((store) => store.id !== id));
    setClosings((prev) => prev.filter((closing) => closing.storeId !== id));
    setGoals((prev) => prev.filter((goal) => goal.storeId !== id));
  };

  const addPaymentMethod = (
    method: Omit<PaymentMethod, "id" | "createdAt">
  ) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
    return newMethod;
  };

  const updatePaymentMethod = (
    id: string,
    methodUpdates: Partial<PaymentMethod>
  ) => {
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === id ? { ...method, ...methodUpdates } : method
      )
    );
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
  };

  const addMovementType = (type: Omit<MovementType, "id" | "createdAt">) => {
    const newType: MovementType = {
      ...type,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setMovementTypes((prev) => [...prev, newType]);
    return newType;
  };

  const updateMovementType = (
    id: string,
    typeUpdates: Partial<MovementType>
  ) => {
    setMovementTypes((prev) =>
      prev.map((type) => (type.id === id ? { ...type, ...typeUpdates } : type))
    );
  };

  const deleteMovementType = (id: string) => {
    setMovementTypes((prev) => prev.filter((type) => type.id !== id));
  };

  const calculateTotals = (movements: MovementItem[]) => {
    const totalEntradas = movements
      .filter((m) => {
        const type = movementTypes.find((t) => t.id === m.movementTypeId);
        return type?.category === "entrada";
      })
      .reduce((sum, m) => sum + m.amount - (m.discount || 0), 0);

    const totalSaidas = movements
      .filter((m) => {
        const type = movementTypes.find((t) => t.id === m.movementTypeId);
        return type?.category === "saida";
      })
      .reduce((sum, m) => sum + m.amount, 0);

    const totalOutros = movements
      .filter((m) => {
        const type = movementTypes.find((t) => t.id === m.movementTypeId);
        return type?.category === "outros";
      })
      .reduce((sum, m) => sum + m.amount, 0);

    return { totalEntradas, totalSaidas, totalOutros };
  };

  const addStoreClosing = (
    closing: Omit<
      StoreClosing,
      | "id"
      | "createdAt"
      | "totalEntradas"
      | "totalSaidas"
      | "totalOutros"
      | "netResult"
    >
  ) => {
    const { totalEntradas, totalSaidas, totalOutros } = calculateTotals(
      closing.movements
    );

    const newClosing: StoreClosing = {
      ...closing,
      id: Date.now().toString(),
      totalEntradas,
      totalSaidas,
      totalOutros,
      netResult: closing.finalBalance - closing.initialBalance,
      createdAt: new Date(),
    };

    setClosings((prev) => [...prev, newClosing]);
    return newClosing;
  };

  const updateClosing = (id: string, closingUpdates: Partial<StoreClosing>) => {
    setClosings((prev) =>
      prev.map((closing) => {
        if (closing.id !== id) return closing;

        // Se há atualizações de movimentos, recalcular os totais
        if (closingUpdates.movements) {
          const { totalEntradas, totalSaidas, totalOutros } = calculateTotals(
            closingUpdates.movements
          );

          // Calcular novo netResult se houver mudanças no saldo final ou inicial
          const finalBalance =
            closingUpdates.finalBalance !== undefined
              ? closingUpdates.finalBalance
              : closing.finalBalance;
          const initialBalance =
            closingUpdates.initialBalance !== undefined
              ? closingUpdates.initialBalance
              : closing.initialBalance;

          return {
            ...closing,
            ...closingUpdates,
            totalEntradas,
            totalSaidas,
            totalOutros,
            netResult: finalBalance - initialBalance,
          };
        }

        return { ...closing, ...closingUpdates };
      })
    );
  };

  const deleteClosing = (id: string) => {
    setClosings((prev) => prev.filter((closing) => closing.id !== id));
  };

  const getClosingsWithDetails = () => {
    return closings.map((closing) => ({
      ...closing,
      store: stores.find((store) => store.id === closing.storeId),
      movements: closing.movements.map((movement) => ({
        ...movement,
        movementType: movementTypes.find(
          (type) => type.id === movement.movementTypeId
        ),
        paymentMethod: paymentMethods.find(
          (method) => method.id === movement.paymentMethodId
        ),
      })),
    }));
  };

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

  const addGoal = (goal: Omit<StoreMeta, "id" | "createdAt">) => {
    const newGoal: StoreMeta = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoal = (id: string, goalUpdates: Partial<StoreMeta>) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...goalUpdates } : goal))
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const getStoreRankings = (): StoreRanking[] => {
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
  };

  return {
    stores,
    closings: getClosingsWithDetails(),
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
    getStoreRankings,
  };
};
