
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PaymentMethod, MovementType } from '@/types/store';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[];
  movementTypes: MovementType[];
  onAddPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => void;
  onDeletePaymentMethod: (id: string) => void;
  onAddMovementType: (type: Omit<MovementType, 'id' | 'createdAt'>) => void;
  onDeleteMovementType: (id: string) => void;
}

const paymentTypeIcons = {
  cash: '💵',
  card: '💳',
  pix: '📱',
  transfer: '🏦',
  other: '💼',
};

const categoryIcons = {
  entrada: '📈',
  saida: '📉',
  outros: '🔄',
};

export const PaymentMethodManager = ({ 
  paymentMethods, 
  movementTypes, 
  onAddPaymentMethod, 
  onDeletePaymentMethod,
  onAddMovementType,
  onDeleteMovementType
}: PaymentMethodManagerProps) => {
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: '',
    type: 'other' as PaymentMethod['type'],
    color: '#6B7280',
    icon: '💼',
  });

  const [newMovementType, setNewMovementType] = useState({
    name: '',
    category: 'outros' as MovementType['category'],
    color: '#6B7280',
    icon: '🔄',
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
      name: '',
      type: 'other',
      color: '#6B7280',
      icon: '💼',
    });

    toast({
      title: "Sucesso",
      description: "Forma de pagamento adicionada!",
    });
  };

  const handleMovementTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMovementType.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    onAddMovementType(newMovementType);

    setNewMovementType({
      name: '',
      category: 'outros',
      color: '#6B7280',
      icon: '🔄',
    });

    toast({
      title: "Sucesso",
      description: "Tipo de movimento adicionado!",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Methods */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💳 Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePaymentMethodSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="paymentName">Nome</Label>
              <Input
                id="paymentName"
                value={newPaymentMethod.name}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Cartão Visa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentType">Tipo</Label>
                <Select
                  value={newPaymentMethod.type}
                  onValueChange={(value: PaymentMethod['type']) => 
                    setNewPaymentMethod(prev => ({ ...prev, type: value, icon: paymentTypeIcons[value] }))
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
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, color: e.target.value }))}
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

      {/* Movement Types */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏷️ Tipos de Movimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleMovementTypeSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="movementName">Nome</Label>
              <Input
                id="movementName"
                value={newMovementType.name}
                onChange={(e) => setNewMovementType(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Vendas à Vista"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="movementCategory">Categoria</Label>
                <Select
                  value={newMovementType.category}
                  onValueChange={(value: MovementType['category']) => 
                    setNewMovementType(prev => ({ ...prev, category: value, icon: categoryIcons[value] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">📈 Entrada</SelectItem>
                    <SelectItem value="saida">📉 Saída</SelectItem>
                    <SelectItem value="outros">🔄 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="movementColor">Cor</Label>
                <Input
                  id="movementColor"
                  type="color"
                  value={newMovementType.color}
                  onChange={(e) => setNewMovementType(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Adicionar Tipo de Movimento
            </Button>
          </form>

          <div className="space-y-2">
            {movementTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.name}</span>
                  <Badge 
                    style={{ backgroundColor: type.color }}
                    className="text-white text-xs"
                  >
                    {type.category}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteMovementType(type.id)}
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
