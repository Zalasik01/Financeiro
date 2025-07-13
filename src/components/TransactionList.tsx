import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx";
import { Transaction } from "@/types/finance";
import { Store } from "@/types/store";
import { formatCurrency } from "@/utils/formatters";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import React from "react";

// --- Novo Componente para o Item da Lista ---

interface TransactionListItemProps {
  transaction: Transaction;
  store?: Store;
  person?: ClienteFornecedor;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string, description: string) => void;
}

const TransactionListItem = React.memo<TransactionListItemProps>(({
  transaction,
  store,
  person,
  onEdit,
  onDelete,
}) => {
  const isRevenue = transaction.type === "Receita";

  const borderColor = isRevenue ? "border-green-500" : "border-red-500";
  const amountColor = isRevenue ? "text-green-600" : "text-red-600";
  const amountSign = isRevenue ? "+" : "-";

  return (
    <div
      className={`flex items-center justify-between p-3 border-l-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-white ${borderColor}`}
    >
      <div className="flex items-center gap-4 flex-grow min-w-0">
        <span className="text-2xl p-2 bg-gray-100 rounded-full">
          {transaction.category?.icon || (isRevenue ? "💰" : "💸")}
        </span>
        <div className="flex-grow min-w-0">
          <p
            className="font-semibold text-gray-800 truncate"
            title={transaction.description}
          >
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mt-1">
            {/* Ordem: Loja >> Cliente >> Data */}
            {store && (
              <>
                <span className="flex items-center gap-1">
                  {store.icon || "🏪"} {store.name}
                </span>
                <span>•</span>
              </>
            )}
            {person && (
              <>
                <span className="flex items-center">{person.nome}</span>
                <span>•</span>
              </>
            )}
            <span>
              {new Date(transaction.date).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge
              style={{
                backgroundColor:
                  transaction.category?.color ||
                  (isRevenue ? "#10B981" : "#EF4444"),
              }}
              className="text-xs text-white"
            >
              {transaction.category?.name}
            </Badge>
            {transaction.discount != null && transaction.discount > 0 && (
              <Badge
                variant="outline"
                className="text-xs text-red-500 border-red-200"
              >
                Desconto: {formatCurrency(transaction.discount)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end ml-4">
        <span className={`font-bold text-lg ${amountColor}`}>
          {amountSign} {formatCurrency(Math.abs(transaction.amount))}
        </span>
        <div className="flex gap-1 mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(transaction)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
            title="Editar transação"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction.id, transaction.description)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
            title="Remover transação"
          >
            <Trash2 size={16} />
          </Button>
        </div>
        {transaction.updatedAt && (
          <div
            className="text-xs text-gray-400 italic mt-1 text-right"
            title={`Editado por ${transaction.updatedBy || "desconhecido"}`}
          >
            <span>
              Editado em{" "}
              {new Date(transaction.updatedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

TransactionListItem.displayName = 'TransactionListItem';

// --- Componente Principal Refatorado ---

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  stores: Store[];
  clientesFornecedores?: ClienteFornecedor[];
}

export const TransactionList = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  stores,
  clientesFornecedores = [],
}: TransactionListProps) => {
  const { toast } = useToast();

  // Otimização: Criar mapas de lookup uma vez para evitar buscas repetitivas dentro do loop.
  const storeMap = useMemo(
    () => new Map(stores.map((s) => [s.id, s])),
    [stores]
  );
  const personMap = useMemo(
    () => new Map(clientesFornecedores.map((p) => [p.id, p])),
    [clientesFornecedores]
  );

  const handleDelete = (id: string, description: string) => {
    onDeleteTransaction(id);
    toast({
      title: "Transação removida",
      description: `"${description}" foi removida com sucesso.`,
      variant: "success",
    });
  };

  // Otimização: A ordenação também pode ser memoizada se a lista de transações for grande.
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [transactions]
  );

  if (
    clientesFornecedores.length > 0 &&
    personMap.size === 0 &&
    transactions.some((t) => t.personId)
  ) {
    console.warn(
      "[TransactionList] `clientesFornecedores` tem dados, mas `personMap` está vazio. Verifique a criação do map."
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
        Últimas Transações
      </h4>
      <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
        {sortedTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhuma transação registrada
          </p>
        ) : (
          sortedTransactions.map((transaction) => {
            const store = storeMap.get(transaction.storeId);
            const person = personMap.get(transaction.personId);
            return (
              <TransactionListItem
                key={transaction.id}
                transaction={transaction}
                store={store}
                person={person}
                onEdit={onEditTransaction}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
