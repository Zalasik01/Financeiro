import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types/finance";
import { Store } from "@/types/store"; // Importar o tipo Store
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  stores: Store[]; // Adicionar stores às props
}

export const TransactionList = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  stores,
}: TransactionListProps) => {
  const { toast } = useToast();

  const handleDelete = (id: string, description: string) => {
    onDeleteTransaction(id);
    toast({
      title: "Transação removida",
      description: `"${description}" foi removida com sucesso.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-700">Transações Recentes</h4>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhuma transação registrada
          </p>
        ) : (
          transactions
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  {" "}
                  {/* Adicionado flex-grow e min-w-0 */}
                  <span className="text-lg">{transaction.category?.icon}</span>
                  <div className="min-w-0">
                    {" "}
                    {/* Adicionado min-w-0 para truncamento */}
                    <p className="font-medium truncate">
                      {" "}
                      {/* Adicionado truncate */}
                      {transaction.description}
                      {transaction.storeId &&
                        stores.find((s) => s.id === transaction.storeId) && (
                          <span className="text-xs text-blue-600 ml-1">
                            |{" "}
                            {stores.find((s) => s.id === transaction.storeId)
                              ?.icon || "🏢"}{" "}
                            {
                              stores.find((s) => s.id === transaction.storeId)
                                ?.name
                            }
                          </span>
                        )}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        style={{
                          backgroundColor:
                            transaction.category?.color ||
                            (transaction.type === "income"
                              ? "#10B981"
                              : "#EF4444"),
                        }}
                        className="text-xs text-white"
                      >
                        {transaction.category?.name}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </span>
                      {transaction.discount != null && transaction.discount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-red-500"
                        >
                          Desconto: {formatCurrency(transaction.discount)}
                        </Badge>
                      )}
                    </div> {/* Fim do <div className="flex items-center gap-2 flex-wrap"> */}
                    {transaction.updatedAt && (
                      <div className="text-xs text-gray-500 italic mt-1">
                        <span>
                          Editado em: {new Date(transaction.updatedAt).toLocaleDateString("pt-BR")}
                          {' às '}
                          {new Date(transaction.updatedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit'})}
                        </span>
                        {transaction.updatedBy && (
                          <span className="ml-1">(por {transaction.updatedBy})</span>
                        )}
                      </div>
                    )}
                  </div> {/* Fim do <div className="min-w-0"> */}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-8 w-8"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(transaction.id, transaction.description)
                      }
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};
