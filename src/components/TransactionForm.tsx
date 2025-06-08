import { useState, useEffect, useRef } from "react"; // Adicionado useRef
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
import { Transaction, Category } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";
import { CurrencyInput } from "./CurrencyInput";
import { useAuth } from "@/hooks/useAuth"; // Adicionar useAuth
import { useStores } from "@/hooks/useStores"; // Importar o hook de lojas
import { HelpTooltip } from "@/components/ui/HelpToolTip"; // Importar o componente de dica

interface TransactionFormProps {
  categories: Category[];
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => void;
  // Ajustar para aceitar null para cancelamento
  onUpdateTransaction?: (
    id: string,
    transaction: Partial<Transaction> | null
  ) => void;
  editingTransaction?: Transaction | null;
  lastUsedFields?: { // Prop para campos da última transação
    type?: "Receita" | "Despesa"; // Ajustado para consistência
    storeId?: string;
    categoryId?: string;
  } | null;
}

export const TransactionForm = ({
  categories,
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  lastUsedFields, // Receber a prop
}: TransactionFormProps) => {
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: 0,
    discount: 0,
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    type: "Despesa" as "Receita" | "Despesa", // Ajustado para consistência
    storeId: undefined as string | undefined, // Adicionar storeId ao estado
  });
  const { toast } = useToast();
  const { stores } = useStores(); // Obter a lista de lojas
  const { currentUser } = useAuth(); // Obter o usuário atual

  // Refs para os campos do formulário
  const descriptionRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null); // Ref para o input dentro de CurrencyInput
  const discountInputRef = useRef<HTMLInputElement>(null); // Ref para o input dentro de CurrencyInput
  const typeSelectRef = useRef<HTMLButtonElement>(null); // SelectTrigger é um botão
  const categorySelectRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const storeSelectRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editingTransaction) {
      setNewTransaction({
        description: editingTransaction.description,
        // Se o valor for negativo (despesa), guardamos como positivo para exibição
        amount: Math.abs(editingTransaction.amount),
        discount: editingTransaction.discount || 0,
        categoryId: editingTransaction.categoryId,
        // Garante que a data no formulário seja a string YYYY-MM-DD correta
        date: new Date(editingTransaction.date).toISOString().split("T")[0],
        type: editingTransaction.type,
        storeId: editingTransaction.storeId, // Carregar storeId se estiver editando
      });
    } else {
      // Não está editando: reseta o formulário,
      // usando lastUsedFields se disponível, ou os padrões.
      const defaultStore = stores.find((s) => s.isDefault);
      let initialStoreId = defaultStore?.id;
      if (!initialStoreId && stores.length === 1) { // Se não há default e só uma loja, usa ela
        initialStoreId = stores[0].id;
      }

      setNewTransaction({
        description: "", // Limpa descrição
        amount: 0,       // Limpa valor
        discount: 0,     // Limpa desconto
        categoryId: lastUsedFields?.categoryId || "", // Usa último usado ou vazio
        date: new Date().toISOString().split("T")[0], // Reseta data
        type: lastUsedFields?.type || "Despesa",     // Usa último usado ou padrão
        storeId: lastUsedFields?.storeId || initialStoreId, // Usa último usado ou inicial
      });
    }
  }, [editingTransaction, lastUsedFields, stores]); // Depende de editingTransaction, lastUsedFields e stores

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newTransaction.description.trim() ||
      newTransaction.amount <= 0 ||
      !newTransaction.categoryId ||
      !newTransaction.storeId
    ) {
      toast({
        title: "Erro",
        description:
          "Todos os campos marcados com * são obrigatórios e o valor deve ser positivo.",
        variant: "destructive",
      });
      return;
    }

    // Calcula o valor final com desconto
    const finalAmount = newTransaction.amount - newTransaction.discount;

    // Verifica se o desconto não é maior que o valor
    if (finalAmount <= 0 && newTransaction.discount > 0) {
      // Apenas erro se houver desconto e ele zerar ou negativar o valor
      toast({
        title: "Erro",
        description:
          "O desconto não pode ser maior ou igual ao valor da transação",
        variant: "destructive",
      });
      return;
    }

    // Ajuste para garantir que a data seja interpretada corretamente no fuso horário local
    const [year, month, day] = newTransaction.date.split("-").map(Number);
    const transactionDateObj = new Date(year, month - 1, day); // Mês é 0-indexado

    const baseTransactionData = {
      description: newTransaction.description,
      amount: newTransaction.type === "Despesa" ? -finalAmount : finalAmount, // Ajustado
      // Se o desconto for 0 ou não definido, passamos null.
      // O hook useFinance tratará se deve incluir o campo ou não.
      discount: newTransaction.discount > 0 ? newTransaction.discount : null,
      categoryId: newTransaction.categoryId,
      date: transactionDateObj,
      type: newTransaction.type,
      storeId: newTransaction.storeId, // Incluir storeId nos dados da transação
    };
    
    if (editingTransaction && onUpdateTransaction) {
      const updatedTransactionData: Partial<Transaction> = {
        ...baseTransactionData,
        updatedAt: new Date(),
        updatedBy: currentUser?.displayName || "Usuário",
      };
      onUpdateTransaction(editingTransaction.id, updatedTransactionData);
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
        variant: "success",
      });
    } else {
      onAddTransaction(baseTransactionData);
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
        variant: "success",
      });
    }

    // O reset do formulário (setNewTransaction) é agora tratado pelo useEffect
    // quando 'editingTransaction' se torna null (após um update/cancel)
    // ou quando 'lastUsedFields' muda (após um add).
  };
  const filteredCategories = categories.filter(
    (cat) => cat.type === newTransaction.type
  );

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>,
    nextFieldRef?: React.RefObject<HTMLElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextFieldRef && nextFieldRef.current) {
        nextFieldRef.current.focus();
        // Para Select, precisamos também simular um clique para abrir o dropdown se for um SelectTrigger
        if (nextFieldRef.current.getAttribute("role") === "combobox") {
          (nextFieldRef.current as HTMLButtonElement).click();
        }
      } else if (submitButtonRef.current) {
        // Se não houver próximo campo, foca e clica no botão de submit
        submitButtonRef.current.focus();
        submitButtonRef.current.click();
      }
    }
  };

  // Efeito para focar no primeiro campo ao montar ou ao limpar após edição
  useEffect(() => {
    if (!editingTransaction && descriptionRef.current) {
      descriptionRef.current.focus();
    }
    // Se estiver editando, o foco pode ser gerenciado de outra forma ou não alterado
    // Se você quiser focar no primeiro campo ao cancelar a edição:
    // if (editingTransaction === null && descriptionRef.current) {
    //   descriptionRef.current.focus();
    // }
  }, [editingTransaction]);
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-gray-50 rounded-lg"
    >
      <div className="flex justify-between items-center">
        {/* O título do formulário permanece aqui */}
        <h3 className="text-lg font-medium text-gray-700">
          {editingTransaction ? "Editar Transação" : "Nova Transação"}
        </h3>
        {/* O botão Cancelar foi movido para baixo, junto com o botão de Atualizar */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center">
            <Label htmlFor="description">Descrição *</Label>
            <HelpTooltip dicaKey="transacaoDescricao" />
          </div>
          <Input
            ref={descriptionRef}
            id="description"
            value={newTransaction.description}
            onChange={(e) =>
              setNewTransaction((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Ex: Supermercado"
            autoComplete="on"
            autoFocus
            required
            onKeyDown={(e) => handleKeyDown(e, amountInputRef)}
          />
        </div>

        <div>
          <CurrencyInput
            label="Valor (R$)" // O tooltip será adicionado dentro do CurrencyInput ou ao lado dele
            id="amount"
            ref={amountInputRef} // Adicionar ref
            value={newTransaction.amount}
            onChange={(value) =>
              setNewTransaction((prev) => ({ ...prev, amount: value }))
            }
            placeholder="R$ 0,00"
            required
            helpTooltipDicaKey="transacaoValor" // Passando a chave da dica
            onKeyDown={(e) => handleKeyDown(e, discountInputRef)} // Adicionar onKeyDown
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <CurrencyInput
            label="Desconto (R$)" // Opcional: adicionar tooltip aqui também se necessário
            id="discount"
            ref={discountInputRef} // Adicionar ref
            value={newTransaction.discount}
            onChange={(value) =>
              setNewTransaction((prev) => ({ ...prev, discount: value }))
            }
            placeholder="R$ 0,00"
            onKeyDown={(e) => handleKeyDown(e, typeSelectRef)} // Adicionar onKeyDown
          />
        </div>

        <div>
          <div className="flex items-center">
            <Label htmlFor="type">Tipo *</Label>
            <HelpTooltip dicaKey="transacaoTipo" />
          </div>
          <Select
            value={newTransaction.type}
            required
            onValueChange={(value: "Receita" | "Despesa") => // Ajustado
              setNewTransaction((prev) => ({
                ...prev,
                type: value,
                categoryId: "",
              }))
            }
          >
            <SelectTrigger
              ref={typeSelectRef}
              onKeyDown={(e) => handleKeyDown(e, categorySelectRef)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Receita">Receita</SelectItem>
              <SelectItem value="Despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center">
            <Label htmlFor="category">Categoria *</Label>
            <HelpTooltip dicaKey="transacaoCategoria" />
          </div>
          <Select
            value={newTransaction.categoryId}
            onValueChange={(value) =>
              setNewTransaction((prev) => ({ ...prev, categoryId: value }))
            }
          >
            <SelectTrigger
              ref={categorySelectRef}
              onKeyDown={(e) => handleKeyDown(e, dateInputRef)}
            >
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
          <div className="flex items-center">
            <Label htmlFor="date">Data *</Label>
            <HelpTooltip dicaKey="transacaoData" />
          </div>
          <Input
            ref={dateInputRef}
            id="date"
            type="date"
            value={newTransaction.date}
            onChange={(e) =>
              setNewTransaction((prev) => ({ ...prev, date: e.target.value }))
            }
            onKeyDown={(e) => handleKeyDown(e, storeSelectRef)}
          />
        </div>

        <div>
          <div className="flex items-center">
            <Label htmlFor="transaction-store">Loja *</Label>
            <HelpTooltip dicaKey="transacaoLoja" />
          </div>
          <Select
            value={newTransaction.storeId || ""}
            onValueChange={(value) =>
              setNewTransaction((prev) => ({
                ...prev,
                storeId: value, // O valor será o ID da loja ou string vazia se nada for selecionado (placeholder)
              }))
            }
          >
            <SelectTrigger
              id="transaction-store"
              ref={storeSelectRef}
              onKeyDown={(e) => handleKeyDown(e, submitButtonRef)}
            >
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
        {newTransaction.amount > 0 &&
          newTransaction.discount > 0 &&
          newTransaction.discount < newTransaction.amount && (
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <span className="block">Valor com desconto:</span>
                <span className="font-bold text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(newTransaction.amount - newTransaction.discount)}
                </span>
              </div>
            </div>
          )}
      </div>

      {/* Botões de Ação */}
      {editingTransaction && onUpdateTransaction ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            onClick={() => {
              setNewTransaction({
                description: "",
                amount: 0,
                discount: 0,
                categoryId: "",
                date: new Date().toISOString().split("T")[0],
                type: "Despesa", // Ajustado
                storeId: undefined,
              });
              onUpdateTransaction(editingTransaction.id, null);
            }}
          >
            Cancelar
          </Button>
          <Button ref={submitButtonRef} type="submit" className="w-full">
            Atualizar Transação
          </Button>
        </div>
      ) : (
        <Button ref={submitButtonRef} type="submit" className="w-full">
          Adicionar Transação
        </Button>
      )}
    </form>
  );
};
