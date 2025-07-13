import React from "react";
import { useNavigate } from "react-router-dom";
import { useStores } from "@/hooks/useStores";
import { Store } from "@/types/store";
import { FormularioLoja } from "./components/FormularioLoja";

export const NovaLojaPage: React.FC = () => {
  const navigate = useNavigate();
  const { addStore } = useStores();

  const handleSalvarLoja = async (lojaData: Partial<Store>) => {
    try {
      await addStore(lojaData as any);
      navigate("/loja");
    } catch (error) {
      console.error("Erro ao adicionar loja:", error);
      throw error;
    }
  };

  return (
    <FormularioLoja 
      onSalvar={handleSalvarLoja}
      editando={false}
    />
  );
};
