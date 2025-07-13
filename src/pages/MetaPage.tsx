import React from "react";
import { useStores } from "@/hooks/useStores";
import { StoreGoals } from "@/components/StoreGoals";

const MetaPage: React.FC = () => {
  const { stores, goals, closings, addGoal, updateGoal, deleteGoal } =
    useStores();

  return (
    <div className="w-[90%] mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Metas das Lojas</h1>
      <StoreGoals
        stores={stores}
        goals={goals}
        closings={closings}
        onAddGoal={addGoal}
        onUpdateGoal={updateGoal}
        onDeleteGoal={deleteGoal}
      />
    </div>
  );
};

export default MetaPage;
