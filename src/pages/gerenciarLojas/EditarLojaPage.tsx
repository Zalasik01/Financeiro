import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStores } from "@/hooks/useStores";
import { Store } from "@/types/store";
import { FormularioLoja } from "./components/FormularioLoja";
import { useToast } from "@/hooks/use-toast";

export const EditarLojaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stores, updateStore } = useStores();
  const { toast } = useToast();
  const [loja, setLoja] = useState<Store | undefined>();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    console.log("EditarLojaPage - useEffect executado");
    console.log("ID da URL:", id);
    console.log("Stores disponíveis:", stores);
    
    if (!id) {
      console.log("ID não encontrado, redirecionando para /loja");
      navigate("/loja");
      return;
    }

    const lojaEncontrada = stores.find(store => store.id === id);
    console.log("Loja encontrada:", lojaEncontrada);
    
    if (!lojaEncontrada) {
      console.log("Loja não encontrada para ID:", id);
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive",
      });
      navigate("/loja");
      return;
    }

    console.log("Definindo loja encontrada no estado");
    setLoja(lojaEncontrada);
    setCarregando(false);
  }, [id, stores, navigate, toast]);

  const handleSalvarLoja = async (lojaData: Partial<Store>) => {
    if (!id) return;
    
    try {
      await updateStore(id, lojaData);
      
      toast({
        title: "Sucesso!",
        description: "Loja atualizada com sucesso!",
        variant: "success",
      });
      
      navigate("/loja");
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      throw error;
    }
  };

  if (carregando) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormularioLoja 
      loja={loja}
      onSalvar={handleSalvarLoja}
      editando={true}
    />
  );
};
