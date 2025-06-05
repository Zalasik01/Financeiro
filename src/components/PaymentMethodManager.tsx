import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PaymentMethod } from "@/types/store";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: (method: Omit<PaymentMethod, "id" | "createdAt">) => void;
  onDeletePaymentMethod: (id: string) => void;
}

const categoryIcons = {
  entrada: "📈",
  saida: "📉",
  outros: "🔄",
};

export const PaymentMethodManager = ({
  paymentMethods,
  onAddPaymentMethod,
  onDeletePaymentMethod,
}: PaymentMethodManagerProps) => {
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: "",
    type: "other" as PaymentMethod["type"],
    color: "#6B7280",
    icon: "💼",
  });

  const { toast } = useToast();

  const handlePaymentMethodSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPaymentMethod.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    onAddPaymentMethod(newPaymentMethod);

    setNewPaymentMethod({
      name: "",
      type: "other",
      color: "#6B7280",
      icon: "💼",
    });

    toast({
      title: "Sucesso",
      description: "Forma de pagamento adicionada!",
    });
  };

  return (
    // Ajustado para ocupar a largura total, já que agora há apenas um card.
    // Você pode querer envolver isso em um div com max-w- se preferir que não ocupe a tela inteira em layouts maiores.
    <div className="w-full">
      {/* Payment Methods */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💳 Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handlePaymentMethodSubmit}
            className="space-y-4 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <Label htmlFor="paymentName">Nome</Label>
              <Input
                id="paymentName"
                value={newPaymentMethod.name}
                onChange={(e) =>
                  setNewPaymentMethod((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Ex: Cartão Visa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentType">Tipo</Label>
                <Select
                  value={newPaymentMethod.type}
                  onValueChange={(value: PaymentMethod["type"]) =>
                    setNewPaymentMethod((prev) => ({
                      ...prev,
                      type: value,
                      // Mantendo a lógica de ícones, caso ainda seja relevante para PaymentMethod
                      icon:
                        value === "cash"
                          ? "💵"
                          : value === "card"
                          ? "💳"
                          : value === "pix"
                          ? "📱"
                          : value === "transfer"
                          ? "🏦"
                          : "💼",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Dinheiro</SelectItem>
                    <SelectItem value="card">💳 Cartão</SelectItem>
                    <SelectItem value="pix">📱 PIX</SelectItem>
                    <SelectItem value="transfer">🏦 Transferência</SelectItem>
                    <SelectItem value="other">💼 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentColor">Cor</Label>
                <Input
                  id="paymentColor"
                  type="color"
                  value={newPaymentMethod.color}
                  onChange={(e) =>
                    setNewPaymentMethod((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Adicionar Forma de Pagamento
            </Button>
          </form>

          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span>{method.icon}</span>
                  <span>{method.name}</span>
                  <Badge
                    style={{ backgroundColor: method.color }}
                    className="text-white text-xs"
                  >
                    {method.type}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeletePaymentMethod(method.id)}
                  className="text-red-600"
                >
                  🗑️
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
