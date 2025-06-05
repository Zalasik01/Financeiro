import React from "react";
import { useStores } from "@/hooks/useStores";
import { MovementTypeManager } from "@/components/MovementTypeManager";

const GerenciarTipoMovimentacaoPage: React.FC = () => {
  const { movementTypes, addMovementType, deleteMovementType } = useStores();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">
        Gerenciamento de Tipos de Movimentação (Loja)
      </h1>
      <MovementTypeManager
        movementTypes={movementTypes}
        onAddMovementType={addMovementType}
        onDeleteMovementType={deleteMovementType}
      />
    </div>
  );
};

export default GerenciarTipoMovimentacaoPage;
