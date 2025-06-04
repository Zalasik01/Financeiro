
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Store, StoreClosing, PaymentMethod, MovementType, MovementItem } from '@/types/store';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from './CurrencyInput';
import { formatCurrency } from '@/utils/formatters';
import { ChevronDown } from 'lucide-react';

interface StoreClosingManagerProps {
  stores: Store[];
  closings: StoreClosing[];
  paymentMethods: PaymentMethod[];
  movementTypes: MovementType[];
  onAddClosing: (closing: Omit<StoreClosing, 'id' | 'createdAt' | 'totalEntradas' | 'totalSaidas' | 'totalOutros' | 'netResult'>) => void;
  onUpdateClosing: (id: string, closing: Partial<StoreClosing>) => void;
  onDeleteClosing: (id: string) => void;
}

export const StoreClosingManager = ({ 
  stores, 
  closings, 
  paymentMethods, 
  movementTypes, 
  onAddClosing, 
  onUpdateClosing,
  onDeleteClosing 
}: StoreClosingManagerProps) => {
  const [newClosing, setNewClosing] = useState({
    storeId: '',
    closingDate: new Date().toISOString().split('T')[0],
    initialBalance: 0,
    finalBalance: 0,
    movements: [] as MovementItem[],
  });

  const [newMovement, setNewMovement] = useState({
    description: '',
    amount: 0,
    discount: 0,
    movementTypeId: '',
    paymentMethodId: '',
  });

  const [editingMovement, setEditingMovement] = useState<{index: number, movement: MovementItem} | null>(null);
  const [expandedClosingId, setExpandedClosingId] = useState<string | null>(null);

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClosing.storeId || newClosing.initialBalance === 0 || newClosing.finalBalance === 0) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive",
      });
      return;
    }

    onAddClosing({
      storeId: newClosing.storeId,
      closingDate: new Date(newClosing.closingDate),
      initialBalance: newClosing.initialBalance,
      finalBalance: newClosing.finalBalance,
      movements: newClosing.movements,
    });

    setNewClosing({
      storeId: '',
      closingDate: new Date().toISOString().split('T')[0],
      initialBalance: 0,
      finalBalance: 0,
      movements: [],
    });

    toast({
      title: "Sucesso",
      description: "Fechamento registrado com sucesso!",
    });
  };

  const addMovement = () => {
    if (!newMovement.description || newMovement.amount === 0 || !newMovement.movementTypeId || !newMovement.paymentMethodId) {
      toast({
        title: "Erro",
        description: "Todos os campos do movimento são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const movement: MovementItem = {
      id: Date.now().toString(),
      description: newMovement.description,
      amount: newMovement.amount,
      discount: newMovement.discount || undefined,
      movementTypeId: newMovement.movementTypeId,
      paymentMethodId: newMovement.paymentMethodId,
    };

    if (editingMovement !== null) {
      // Atualizando movimento existente
      const updatedMovements = [...newClosing.movements];
      updatedMovements[editingMovement.index] = {
        ...movement,
        id: editingMovement.movement.id
      };

      setNewClosing(prev => ({
        ...prev,
        movements: updatedMovements,
      }));

      setEditingMovement(null);
      
      toast({
        title: "Movimento atualizado",
        description: "O movimento foi atualizado com sucesso!",
      });
    } else {
      // Adicionando novo movimento
      setNewClosing(prev => ({
        ...prev,
        movements: [...prev.movements, movement],
      }));
    }

    setNewMovement({
      description: '',
      amount: 0,
      discount: 0,
      movementTypeId: '',
      paymentMethodId: '',
    });
  };

  const editMovement = (index: number) => {
    const movement = newClosing.movements[index];
    setNewMovement({
      description: movement.description,
      amount: movement.amount,
      discount: movement.discount || 0,
      movementTypeId: movement.movementTypeId,
      paymentMethodId: movement.paymentMethodId,
    });
    setEditingMovement({ index, movement });
  };

  const removeMovement = (movementId: string) => {
    setNewClosing(prev => ({
      ...prev,
      movements: prev.movements.filter(m => m.id !== movementId),
    }));
    
    if (editingMovement?.movement.id === movementId) {
      setEditingMovement(null);
      setNewMovement({
        description: '',
        amount: 0,
        discount: 0,
        movementTypeId: '',
        paymentMethodId: '',
      });
    }
  };

  const getMovementTypeColor = (typeId: string) => {
    const type = movementTypes.find(t => t.id === typeId);
    return type?.color || '#6B7280';
  };

  const toggleClosingDetails = (closingId: string) => {
    setExpandedClosingId(prevId => prevId === closingId ? null : closingId);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Fazer Fechamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-gray-50 rounded-lg">
          {/* Store and Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store">Loja *</Label>
              <Select
                value={newClosing.storeId}
                onValueChange={(value) => setNewClosing(prev => ({ ...prev, storeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.icon || '🏪'} {store.name} {store.nickname && `(${store.nickname})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="closingDate">Data do Fechamento *</Label>
              <Input
                id="closingDate"
                type="date"
                value={newClosing.closingDate}
                onChange={(e) => setNewClosing(prev => ({ ...prev, closingDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Saldo Inicial (R$) *"
                id="initialBalance"
                value={newClosing.initialBalance}
                onChange={(value) => setNewClosing(prev => ({ ...prev, initialBalance: value }))}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div>
              <CurrencyInput
                label="Saldo Final (R$) *"
                id="finalBalance"
                value={newClosing.finalBalance}
                onChange={(value) => setNewClosing(prev => ({ ...prev, finalBalance: value }))}
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          {/* Add Movements */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-4">
              {editingMovement !== null ? 'Editar Movimento' : 'Adicionar Movimentos'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="movementDescription">Descrição</Label>
                <Input
                  id="movementDescription"
                  value={newMovement.description}
                  onChange={(e) => setNewMovement(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Venda no cartão"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Valor (R$)"
                  id="movementAmount"
                  value={newMovement.amount}
                  onChange={(value) => setNewMovement(prev => ({ ...prev, amount: value }))}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <CurrencyInput
                  label="Desconto (R$)"
                  id="movementDiscount"
                  value={newMovement.discount}
                  onChange={(value) => setNewMovement(prev => ({ ...prev, discount: value }))}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <Label htmlFor="movementType">Tipo de Movimento</Label>
                <Select
                  value={newMovement.movementTypeId}
                  onValueChange={(value) => setNewMovement(prev => ({ ...prev, movementTypeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={newMovement.paymentMethodId}
                  onValueChange={(value) => setNewMovement(prev => ({ ...prev, paymentMethodId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.icon} {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="button" 
              onClick={addMovement} 
              variant="outline" 
              className="w-full mb-4"
            >
              {editingMovement !== null ? 'Atualizar Movimento' : 'Adicionar Movimento'}
            </Button>

            {editingMovement !== null && (
              <Button 
                type="button" 
                onClick={() => {
                  setEditingMovement(null);
                  setNewMovement({
                    description: '',
                    amount: 0,
                    discount: 0,
                    movementTypeId: '',
                    paymentMethodId: '',
                  });
                }} 
                variant="ghost" 
                className="w-full mb-4"
              >
                Cancelar Edição
              </Button>
            )}

            {/* Movement List */}
            {newClosing.movements.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm text-gray-600">Movimentos Adicionados:</h5>
                {newClosing.movements.map((movement, index) => {
                  const type = movementTypes.find(t => t.id === movement.movementTypeId);
                  const method = paymentMethods.find(m => m.id === movement.paymentMethodId);
                  return (
                    <div 
                      key={movement.id} 
                      className={`flex items-center justify-between p-2 rounded border ${
                        editingMovement?.movement.id === movement.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{type?.icon}</span>
                        <span className="text-sm">{movement.description}</span>
                        <Badge 
                          style={{ backgroundColor: getMovementTypeColor(movement.movementTypeId) }}
                          className="text-white text-xs"
                        >
                          {type?.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {method?.icon} {method?.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(movement.amount)}</span>
                          {movement.discount && movement.discount > 0 && (
                            <span className="text-xs text-red-500 block">
                              Desconto: {formatCurrency(movement.discount)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editMovement(index)}
                            className="text-blue-600 h-8 w-8 p-0"
                          >
                            ✏️
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMovement(movement.id)}
                            className="text-red-600 h-8 w-8 p-0"
                          >
                            ❌
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={stores.length === 0}>
            {stores.length === 0 ? 'Cadastre uma loja primeiro' : 'Registrar Fechamento'}
          </Button>
        </form>

        {/* Closings List */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Fechamentos Registrados</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {closings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum fechamento registrado</p>
            ) : (
              closings
                .sort((a, b) => new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime())
                .map((closing) => (
                  <Collapsible
                    key={closing.id}
                    open={expandedClosingId === closing.id}
                    onOpenChange={() => toggleClosingDetails(closing.id)}
                    className="border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{closing.store?.icon || '🏪'}</span>
                          <div>
                            <p className="font-medium">{closing.store?.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(closing.closingDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-8 w-8"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedClosingId === closing.id ? 'transform rotate-180' : ''
                                }`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteClosing(closing.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Saldo Inicial:</span>
                          <p className="font-medium">{formatCurrency(closing.initialBalance)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Saldo Final:</span>
                          <p className="font-medium">{formatCurrency(closing.finalBalance)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Entradas:</span>
                          <p className="font-medium text-green-600">{formatCurrency(closing.totalEntradas)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Saídas:</span>
                          <p className="font-medium text-red-600">{formatCurrency(closing.totalSaidas)}</p>
                        </div>
                      </div>

                      {closing.movements.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {closing.movements.length} movimento(s) registrado(s)
                        </div>
                      )}
                    </div>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2 bg-gray-50 rounded-b-lg">
                        <h5 className="font-medium text-sm text-gray-600 pt-2">Movimentos:</h5>
                        {closing.movements.map((movement) => {
                          const type = movement.movementType;
                          const method = movement.paymentMethod;
                          return (
                            <div key={movement.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                <span>{type?.icon || '📝'}</span>
                                <span className="text-sm">{movement.description}</span>
                                {type && (
                                  <Badge 
                                    style={{ backgroundColor: type.color }}
                                    className="text-white text-xs"
                                  >
                                    {type.name}
                                  </Badge>
                                )}
                                {method && (
                                  <Badge variant="outline" className="text-xs">
                                    {method.icon} {method.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{formatCurrency(movement.amount)}</span>
                                {movement.discount && movement.discount > 0 && (
                                  <span className="text-xs text-red-500 block">
                                    Desconto: {formatCurrency(movement.discount)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
