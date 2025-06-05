import React from "react";
import { useStores } from "@/hooks/useStores";
import { StoreManager } from "@/components/StoreManager";

const LojaPage: React.FC = () => {
  const { stores, addStore, updateStore, deleteStore } = useStores();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Lojas</h1>
      <StoreManager
        stores={stores}
        onAddStore={addStore}
        onUpdateStore={updateStore}
        onDeleteStore={deleteStore}
      />
    </div>
  );
};

export default LojaPage;
