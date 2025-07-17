import React, { useState } from "react";  return (
    <div className="w-[90%] mx-auto space-y-6">import { PaymentMethodManager } from "@/components/PaymentMethodManager";
import { PaymentMethod } from "@/types/store";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

const ManagePaymentMethodsPage: React.FC = () => {
  const { toast } = useToast();

  // Em uma aplicação real, isso viria de um hook/context (ex: useStoreSettings ou useFinance)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const handleAddPaymentMethod = (
    method: Omit<PaymentMethod, "id" | "createdAt">
  ) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
    toast({
      title: "Forma de Pagamento Adicionada",
      description: `${method.name} foi adicionada com sucesso.`,
      variant: "success",
    });
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    toast({
      title: "Forma de Pagamento Removida",
      description: `A forma de pagamento foi removida.`,
      variant: "success",
    });
  };

  return (
    <div className="w-[90%] mx-auto p-4 space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">
          Gerenciamento de Formas de Pagamento
        </h1>
        <PaymentMethodManager
          paymentMethods={paymentMethods}
          onAddPaymentMethod={handleAddPaymentMethod}
          onDeletePaymentMethod={handleDeletePaymentMethod}
        />
      </section>
    </div>
  );
};

export default ManagePaymentMethodsPage;
