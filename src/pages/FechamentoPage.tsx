import React from "react";
import { useStores } from "@/hooks/useStores";
import { StoreClosingManager } from "@/components/StoreClosingManager";

const FechamentoPage: React.FC = () => {
  const {
    stores,
    closings,
    paymentMethods,
    movementTypes,
    addStoreClosing,
    updateClosing,
    deleteClosing,
  } = useStores();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">
        Gerenciamento de Fechamentos de Loja
      </h1>
      <StoreClosingManager
        stores={stores}
        closings={closings}
        paymentMethods={paymentMethods}
        movementTypes={movementTypes}
        onAddClosing={addStoreClosing}
        onUpdateClosing={updateClosing}
        onDeleteClosing={deleteClosing}
      />
    </div>
  );
};

export default FechamentoPage;
