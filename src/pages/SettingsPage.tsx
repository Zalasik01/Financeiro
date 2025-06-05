import React, { useState } from "react";
import UserAccessMatrix from "@/components/UserAccessMatrix";
import { PaymentMethodManager } from "@/components/PaymentMethodManager"; // Importar o gerenciador
import { PaymentMethod } from "@/types/store"; // Importar o tipo PaymentMethod
import { useToast } from "@/hooks/use-toast"; // Para feedback ao usuário
import { v4 as uuidv4 } from "uuid"; // Para gerar IDs únicos

const SettingsPage: React.FC = () => {
  const { toast } = useToast();

  // Estado para gerenciar as formas de pagamento (simulação)
  // Em uma aplicação real, isso viria de um hook/context (ex: useStoreSettings ou useFinance)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const handleAddPaymentMethod = (
    method: Omit<PaymentMethod, "id" | "createdAt">
  ) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: uuidv4(),
      createdAt: new Date().toISOString(), // Ou Date, dependendo da sua definição de tipo
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
    // Aqui você também chamaria a função do seu hook para salvar no Firebase
    // Ex: addPaymentMethodToFirebase(newMethod);
    toast({
      title: "Forma de Pagamento Adicionada",
      description: `${method.name} foi adicionada com sucesso. (Simulação)`,
    });
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    // Aqui você também chamaria a função do seu hook para remover do Firebase
    // Ex: deletePaymentMethodFromFirebase(id);
    toast({
      title: "Forma de Pagamento Removida",
      description: `A forma de pagamento foi removida. (Simulação)`,
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>

      {/* Seção para Gerenciar Formas de Pagamento */}
      <section className="space-y-4">
        {/*
          O componente PaymentMethodManager já renderiza um Card com título,
          então não precisamos de um h2 aqui se ele já for autoexplicativo.
          Se quiser um título de seção explícito, pode adicionar:
          <h2 className="text-xl font-semibold mb-2">
            💳 Formas de Pagamento
          </h2>
        */}
        <PaymentMethodManager
          paymentMethods={paymentMethods}
          onAddPaymentMethod={handleAddPaymentMethod}
          onDeletePaymentMethod={handleDeletePaymentMethod}
        />
      </section>

      {/* Seção para Matriz de Acesso de Usuários */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">
          Acesso de Usuários por Base
        </h2>
        <UserAccessMatrix />
      </section>
    </div>
  );
};

export default SettingsPage;
