import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, Category } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from './CurrencyInput';
import { useStores } from '@/hooks/useStores'; // Importar o hook de lojas

interface TransactionFormProps {
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  // Ajustar para aceitar null para cancelamento
  onUpdateTransaction?: (id: string, transaction: Partial<Transaction> | null) => void;
  editingTransaction?: Transaction | null;
}

export const TransactionForm = ({ 
  categories, 
  onAddTransaction, 
  onUpdateTransaction, 
  editingTransaction 
}: TransactionFormProps) => {
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    discount: 0,
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    storeId: undefined as string | undefined, // Adicionar storeId ao estado
  });
  const { toast } = useToast();
  const { stores } = useStores(); // Obter a lista de lojas

  useEffect(() => {
    if (editingTransaction) {
      setNewTransaction({
        description: editingTransaction.description,
        // Se o valor for negativo (despesa), guardamos como positivo para exibição
        amount: Math.abs(editingTransaction.amount),
        discount: editingTransaction.discount || 0,
        categoryId: editingTransaction.categoryId, 
        // Garante que a data no formulário seja a string YYYY-MM-DD correta
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        type: editingTransaction.type,
        storeId: editingTransaction.storeId, // Carregar storeId se estiver editando
      });
    }
  }, [editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.description.trim() || newTransaction.amount <= 0 || !newTransaction.categoryId || !newTransaction.storeId) {
      toast({
        title: "Erro",
        description: "Todos os campos marcados com * são obrigatórios e o valor deve ser positivo.",
        variant: "destructive",
      });
      return;
    }

    // Calcula o valor final com desconto
    const finalAmount = newTransaction.amount - newTransaction.discount;
    
    // Verifica se o desconto não é maior que o valor
    if (finalAmount <= 0 && newTransaction.discount > 0) { // Apenas erro se houver desconto e ele zerar ou negativar o valor
      toast({
        title: "Erro",
        description: "O desconto não pode ser maior ou igual ao valor da transação",
        variant: "destructive",
      });
      return;
    }

    // Ajuste para garantir que a data seja interpretada corretamente no fuso horário local
    const [year, month, day] = newTransaction.date.split('-').map(Number);
    const transactionDateObj = new Date(year, month - 1, day); // Mês é 0-indexado

    const transactionData = {
      description: newTransaction.description,
      amount: newTransaction.type === 'expense' ? -finalAmount : finalAmount,
      discount: newTransaction.discount > 0 ? newTransaction.discount : undefined,
      categoryId: newTransaction.categoryId,
      date: transactionDateObj,
      type: newTransaction.type,
      storeId: newTransaction.storeId, // Incluir storeId nos dados da transação
    };

    if (editingTransaction && onUpdateTransaction) {
      onUpdateTransaction(editingTransaction.id, transactionData);
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });
    } else {
      onAddTransaction(transactionData);
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
    }

    setNewTransaction({
      description: '',
      amount: 0,
      discount: 0,
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      storeId: undefined,
    });
  };

  const filteredCategories = categories.filter(cat => cat.type === newTransaction.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">
          {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        </h3>
        {editingTransaction && onUpdateTransaction && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewTransaction({
                description: '',
                amount: 0,
                discount: 0,
                categoryId: '',
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                storeId: undefined,
              });
              // Chamamos onUpdateTransaction com o mesmo id mas passando null como dado
              // A implementação então irá cancelar a edição
              onUpdateTransaction(editingTransaction.id, null);
            }}
          >
            Cancelar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Ex: Supermercado"
          />
        </div>
        
        <div>
          <CurrencyInput
            label="Valor (R$)"
            id="amount"
            value={newTransaction.amount}
            onChange={(value) => setNewTransaction(prev => ({ ...prev, amount: value }))}
            placeholder="R$ 0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <CurrencyInput
            label="Desconto (R$)"
            id="discount"
            value={newTransaction.discount}
            onChange={(value) => setNewTransaction(prev => ({ ...prev, discount: value }))}
            placeholder="R$ 0,00"
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={newTransaction.type}
            onValueChange={(value: 'income' | 'expense') => 
              setNewTransaction(prev => ({ ...prev, type: value, categoryId: '' }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={newTransaction.categoryId}
            onValueChange={(value) => setNewTransaction(prev => ({ ...prev, categoryId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="transaction-store">Loja *</Label>
          <Select
            value={newTransaction.storeId || ""}
            onValueChange={(value) =>
              setNewTransaction((prev) => ({
                ...prev,
                storeId: value, // O valor será o ID da loja ou string vazia se nada for selecionado (placeholder)
              }))
            }
          >
            <SelectTrigger id="transaction-store">
              <SelectValue placeholder="Selecione a loja..." />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">- Não selecionado</SelectItem>  Removido para corrigir o erro do Radix UI */}
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.icon || "🏪"} {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conditional rendering for discount display */}
        {newTransaction.amount > 0 && newTransaction.discount > 0 && newTransaction.discount < newTransaction.amount && (
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="block">Valor com desconto:</span>
              <span className="font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(newTransaction.amount - newTransaction.discount)}
              </span>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        {editingTransaction ? 'Atualizar Transação' : 'Adicionar Transação'}
      </Button>
    </form>
  );
};
