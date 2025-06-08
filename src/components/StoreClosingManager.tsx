import { useState, useMemo, useEffect } from "react"; // Adicionado useEffect
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
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Store,
  StoreClosing,
  PaymentMethod,
  // MovementType, // Removido se não for mais usado aqui
  MovementItem,
} from "@/types/store";
import { useToast } from "@/hooks/use-toast";
import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency } from "@/utils/formatters";
import { ChevronDown } from "lucide-react";
import { useFinance } from "@/hooks/useFinance"; // Importar useFinance
import { HelpTooltip } from "@/components/ui/HelpToolTip"; // Importar

interface StoreClosingManagerProps {
  stores: Store[];
  closings: StoreClosing[];
  paymentMethods: PaymentMethod[];
  // movementTypes: MovementType[]; // Removido
  onAddClosing: (
    closing: Omit<
      StoreClosing,
      | "id"
      | "createdAt"
      | "totalEntradas"
      | "totalSaidas"
      | "totalOutros"
      | "netResult"
    > & { movements: MovementItem[] } // Garantir que movements seja esperado
  ) => void;
  onUpdateClosing: (id: string, closing: Partial<StoreClosing>) => void;
  onDeleteClosing: (id: string) => void;
}

export const StoreClosingManager = ({
  stores,
  closings,
  paymentMethods,
  // movementTypes, // Removido
  onAddClosing,
  onUpdateClosing,
  onDeleteClosing,
}: // transactions, // Adicionar transactions se for passado como prop
  StoreClosingManagerProps) => {
  const [newClosing, setNewClosing] = useState({
    storeId: "",
    closingDate: new Date().toISOString().split("T")[0],
    initialBalance: 0,
    finalBalance: 0,
    movements: [] as MovementItem[],
  });

  const {
    transactions: personalTransactions,
    removeTransactionsByDateAndStore,
  } = useFinance();

  const [editingMovement, setEditingMovement] = useState<{
    index: number;
    movement: MovementItem;
  } | null>(null);
  const [expandedClosingId, setExpandedClosingId] = useState<string | null>(
    null
  );

  const [sortBy, setSortBy] = useState<string>("date-desc"); // Estado para critério de ordenação

  const sortOptions = [
    { value: "date-desc", label: "Data (Mais Recente)" },
    { value: "date-asc", label: "Data (Mais Antigo)" },
    { value: "storeName-asc", label: "Loja (A-Z)" },
    { value: "storeName-desc", label: "Loja (Z-A)" },
    {
      value: "netResult-positive-priority-desc",
      label: "Resultado Positivo (Maior para Menor)",
    },
    {
      value: "netResult-positive-priority-asc",
      label: "Resultado Positivo (Menor para Maior)",
    },
    {
      value: "netResult-negative-priority-desc",
      label: "Resultado Negativo (Próximo de Zero)",
    },
    {
      value: "netResult-negative-priority-asc",
      label: "Resultado Negativo (Distante de Zero)",
    },
  ];
  const { toast } = useToast();

  useEffect(() => {
    const defaultStore = stores.find((s) => s.isDefault);
    if (defaultStore && !newClosing.storeId) {
      setNewClosing((prev) => ({ ...prev, storeId: defaultStore.id }));
    } else if (stores.length === 1 && !newClosing.storeId) {
      setNewClosing((prev) => ({ ...prev, storeId: stores[0].id }));
    } else if (
      !defaultStore &&
      stores.length > 1 &&
      newClosing.storeId &&
      !stores.find((s) => s.id === newClosing.storeId)
    ) {
      setNewClosing((prev) => ({ ...prev, storeId: "" }));
    }
  }, [stores, newClosing.storeId]);

  useEffect(() => {
    // Garante que temos uma data válida para filtrar as transações pessoais
    if (!newClosing.closingDate || !newClosing.storeId) {
      // Se não houver data ou loja, não podemos calcular as transações relevantes
      // Poderia-se definir o saldo final como igual ao inicial ou zerar, dependendo da preferência.
      // Por ora, apenas não prosseguiremos se não houver data/loja.
      // Ou, alternativamente, calcular apenas com base nos movimentos manuais e saldo inicial.
      // Para este exemplo, vamos calcular com o que temos.
    }

    const [year, month, day] = newClosing.closingDate.split("-").map(Number);
    const closingDateObj = new Date(year, month - 1, day);

    const relevantPersonalTransactions = personalTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.storeId === newClosing.storeId &&
        transactionDate.getFullYear() === closingDateObj.getFullYear() &&
        transactionDate.getMonth() === closingDateObj.getMonth() &&
        transactionDate.getDate() === closingDateObj.getDate()
      );
    });

    const movementsFromPersonalTransactions: MovementItem[] =
      relevantPersonalTransactions.map((t) => ({
        id: `mov-from-trans-${t.id}`,
        description: t.description,
        amount: Math.abs(t.amount),
        discount: t.discount || 0,
        transactionType: t.type, // t.type já é "Receita" ou "Despesa"
        paymentMethodId: "N/A",
        createdAt: t.createdAt,
      }));

    const allMovementsForSuggestion = [...newClosing.movements, ...movementsFromPersonalTransactions];

    const totalEntradas = allMovementsForSuggestion
      .filter((m) => m.transactionType === "Receita")
      .reduce((sum, m) => sum + m.amount - (m.discount || 0), 0);

    const totalSaidas = allMovementsForSuggestion
      .filter((m) => m.transactionType === "Despesa")
      .reduce((sum, m) => sum + m.amount, 0);

    const suggestedFinalBalance = newClosing.initialBalance + totalEntradas - totalSaidas;
    
    setNewClosing(prev => ({
      ...prev,
      finalBalance: suggestedFinalBalance
    }));

  }, [newClosing.initialBalance, newClosing.movements, personalTransactions, newClosing.storeId, newClosing.closingDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newClosing.storeId ||
      newClosing.initialBalance === 0 ||
      newClosing.finalBalance === 0
    ) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive",
      });
      return;
    }

    // Ajuste para garantir que a data seja interpretada corretamente no fuso horário local
    const [year, month, day] = newClosing.closingDate.split("-").map(Number);
    // O mês no construtor Date é 0-indexado (0 para Janeiro, 11 para Dezembro)
    const closingDateObj = new Date(year, month - 1, day);

    // 1. Filtrar transações pessoais pela data e loja do fechamento
    const relevantPersonalTransactions = personalTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.storeId === newClosing.storeId &&
        transactionDate.getFullYear() === closingDateObj.getFullYear() &&
        transactionDate.getMonth() === closingDateObj.getMonth() &&
        transactionDate.getDate() === closingDateObj.getDate()
      );
    });

    // 2. Mapear Transaction para MovementItem
    const movementsFromPersonalTransactions: MovementItem[] =
      relevantPersonalTransactions.map((t) => {
        const transactionTypeForMovement: "Receita" | "Despesa" =
          t.type === "Receita" ? "Receita" : "Despesa";
        return {
          id: `mov-from-trans-${t.id}`, // ID único para o movimento
          description: t.description,
          amount: Math.abs(t.amount), // Valor sempre positivo
          discount: t.discount || 0,
          transactionType: transactionTypeForMovement,
          paymentMethodId: "N/A", // Ou um método padrão se aplicável
          createdAt: t.createdAt, // Herda da transação original
          // updateAt: t.updatedAt, // Herda se existir e for relevante
        };
      });

    console.log(
      "Movimentos gerados a partir das transações:",
      movementsFromPersonalTransactions
    );

    // ADICIONE ESTE LOG:
    console.log("Fechamento enviado para onAddClosing:", {
      storeId: newClosing.storeId,
      closingDate: closingDateObj,
      initialBalance: newClosing.initialBalance,
      finalBalance: newClosing.finalBalance,
      movements: [
        ...newClosing.movements,
        ...movementsFromPersonalTransactions,
      ],
    });

    onAddClosing({
      storeId: newClosing.storeId,
      closingDate: closingDateObj,
      initialBalance: newClosing.initialBalance,
      finalBalance: newClosing.finalBalance,
      movements: [
        ...newClosing.movements,
        ...movementsFromPersonalTransactions,
      ], // Combina movimentos manuais com os de transações
    });

    setNewClosing({
      storeId: "",
      closingDate: new Date().toISOString().split("T")[0],
      initialBalance: 0,
      finalBalance: 0,
      movements: [],
    });

    // 3. Remover as transações pessoais que foram movidas
    removeTransactionsByDateAndStore(closingDateObj, newClosing.storeId);

    toast({
      title: "Sucesso",
      description: "Fechamento registrado com sucesso!",
      variant: "success",
    });
  };

  const toggleClosingDetails = (closingId: string) => {
    setExpandedClosingId((prevId) => (prevId === closingId ? null : closingId));
  };

  // Mapeia o ID do fechamento para um número sequencial (ex: 1, 2, 3...)
  // O fechamento mais antigo terá o número 1.
  const closingNumbersMap = useMemo(() => {
    const sortedClosingsForNumbering = [...closings].sort(
      (a, b) =>
        new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
    );
    const map = new Map<string, number>();
    sortedClosingsForNumbering.forEach((closing, index) => {
      map.set(closing.id, index + 1);
    });
    return map;
  }, [closings]);

  const sortedAndFilteredClosings = useMemo(() => {
    const sorted = [...closings];
    switch (sortBy) {
      case "date-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.closingDate).getTime() -
            new Date(b.closingDate).getTime()
        );
        break;
      case "storeName-asc":
        sorted.sort((a, b) =>
          (a.store?.name || "").localeCompare(b.store?.name || "")
        );
        break;
      case "storeName-desc":
        sorted.sort((a, b) =>
          (b.store?.name || "").localeCompare(a.store?.name || "")
        );
        break;
      case "netResult-positive-priority-desc": // Positivos primeiro (maior para menor), depois negativos (mais próximo de zero para mais distante)
        sorted.sort((a, b) => {
          const aIsPositive = a.netResult >= 0;
          const bIsPositive = b.netResult >= 0;
          if (aIsPositive && !bIsPositive) return -1;
          if (!aIsPositive && bIsPositive) return 1;
          if (aIsPositive && bIsPositive) return b.netResult - a.netResult; // Positivos: maior primeiro
          return b.netResult - a.netResult; // Negativos: mais próximo de zero primeiro
        });
        break;
      case "netResult-positive-priority-asc": // Positivos primeiro (menor para maior), depois negativos (mais distante de zero para mais próximo)
        sorted.sort((a, b) => {
          const aIsPositive = a.netResult >= 0;
          const bIsPositive = b.netResult >= 0;
          if (aIsPositive && !bIsPositive) return -1;
          if (!aIsPositive && bIsPositive) return 1;
          if (aIsPositive && bIsPositive) return a.netResult - b.netResult; // Positivos: menor primeiro
          return a.netResult - b.netResult; // Negativos: mais distante de zero primeiro
        });
        break;
      case "netResult-negative-priority-desc": // Negativos primeiro (mais próximo de zero), depois positivos (maior para menor)
        sorted.sort((a, b) => {
          const aIsNegative = a.netResult < 0;
          const bIsNegative = b.netResult < 0;
          if (aIsNegative && !bIsNegative) return -1;
          if (!aIsNegative && bIsNegative) return 1;
          if (aIsNegative && bIsNegative) return b.netResult - a.netResult; // Negativos: mais próximo de zero primeiro
          return b.netResult - a.netResult; // Positivos: maior primeiro
        });
        break;
      case "netResult-negative-priority-asc": // Negativos primeiro (mais distante de zero), depois positivos (menor para maior)
        sorted.sort((a, b) => {
          const aIsNegative = a.netResult < 0;
          const bIsNegative = b.netResult < 0;
          if (aIsNegative && !bIsNegative) return -1;
          if (!aIsNegative && bIsNegative) return 1;
          if (aIsNegative && bIsNegative) return a.netResult - b.netResult; // Negativos: mais distante de zero primeiro
          return a.netResult - b.netResult; // Positivos: menor primeiro
        });
        break;
      case "date-desc": // Padrão
      default:
        console.log("[StoreClosingManager] Ordenando por:", sortBy);

        sorted.sort(
          (a, b) =>
            new Date(b.closingDate).getTime() -
            new Date(a.closingDate).getTime() // Mais recente primeiro
        );
    }
    return sorted;
  }, [closings, sortBy]);
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>
            📊 Fazer Fechamento
          </span>
          <HelpTooltip dicaKey="fazerFechamento" side="bottom"/>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-4 bg-gray-50 rounded-lg"
        >
          {/* Store and Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Label htmlFor="store">Loja *</Label>
                <HelpTooltip dicaKey="fechamentoLoja" />
              </div>
              <Select
                value={newClosing.storeId}
                onValueChange={(value) =>
                  setNewClosing((prev) => ({ ...prev, storeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.icon || "🏪"} {store.name}{" "}
                      {store.nickname && `(${store.nickname})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center">
                <Label htmlFor="closingDate">Data do Fechamento *</Label>
                <HelpTooltip dicaKey="fechamentoData" />
              </div>
              <Input
                id="closingDate"
                type="date"
                value={newClosing.closingDate}
                onChange={(e) =>
                  setNewClosing((prev) => ({
                    ...prev,
                    closingDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Saldo Inicial (R$)"
                id="initialBalance"
                value={newClosing.initialBalance}
                onChange={(value) =>
                  setNewClosing((prev) => ({ ...prev, initialBalance: value }))
                }
                placeholder="R$ 0,00"
                required
                helpTooltipDicaKey="fechamentoSaldoInicial"
              />
            </div>

            <div>
              <CurrencyInput
                label="Saldo Final (R$)"
                id="finalBalance"
                value={newClosing.finalBalance}
                onChange={(value) =>
                  setNewClosing((prev) => ({ ...prev, finalBalance: value }))
                }
                placeholder="R$ 0,00"
                required
                helpTooltipDicaKey="fechamentoSaldoFinal"
              />
            </div>
          </div>

          {/* Remover seção de movimentos */}
          {/*
            <div className="border-t pt-4">
              ... conteúdo removido ...
            </div>
          */}

          <Button
            type="submit"
            className="w-full"
            disabled={stores.length === 0}
          >
            {stores.length === 0
              ? "Cadastre uma loja primeiro"
              : "Registrar Fechamento"}
          </Button>
        </form>

        {/* Closings List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700">
              Fechamentos Registrados
            </h4>
            <div className="w-56">
              {" "}
              {/* Ajuste a largura conforme necessário */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedAndFilteredClosings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum fechamento registrado
              </p>
            ) : (
              sortedAndFilteredClosings.map((closing) => (
                <Collapsible
                  key={closing.id}
                  open={expandedClosingId === closing.id}
                  onOpenChange={() => toggleClosingDetails(closing.id)}
                  className="border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {closing.store?.icon || "🏪"}
                        </span>
                        <div>
                          <p className="font-medium">
                            {closing.store?.name}
                            {closingNumbersMap.has(closing.id) && (
                              <span className="text-gray-500 font-normal ml-1">
                                (#{closingNumbersMap.get(closing.id)})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold">
                              Data do fechamento:
                            </span>{" "}
                            {new Date(closing.closingDate).toLocaleDateString(
                              "pt-BR"
                            )}
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
                              className={`h-4 w-4 transition-transform ${expandedClosingId === closing.id
                                ? "transform rotate-180"
                                : ""
                                }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onDeleteClosing(closing.id);
                            toast({
                              title: "Fechamento Removido",
                              description: `O fechamento da loja "${closing.store?.name || "Desconhecida"
                                }" de ${new Date(
                                  closing.closingDate
                                ).toLocaleDateString("pt-BR")} foi removido.`,
                              variant: "success",
                            });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Saldo Inicial:</span>
                        <p className="font-medium">
                          {formatCurrency(closing.initialBalance)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Saldo Final:</span>
                        <p className="font-medium">
                          {formatCurrency(closing.finalBalance)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Entradas:</span>
                        <p className="font-medium text-green-600">
                          {formatCurrency(closing.totalEntradas)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Saídas:</span>
                        <p className="font-medium text-red-600">
                          {formatCurrency(closing.totalSaidas)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Resultado:</span>
                        <p
                          className={`font-medium ${closing.netResult >= 0
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                        >
                          {formatCurrency(closing.netResult)}
                        </p>
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
                      <h5 className="font-medium text-sm text-gray-600 pt-2">
                        Movimentações:
                        <span className="ml-2 font-normal text-gray-500">
                          {closing.movements.length} movimento(s)
                        </span>
                      </h5>
                      {closing.movements && closing.movements.length > 0 ? (
                        closing.movements.map((movement) => {
                          const method = movement.paymentMethod; // paymentMethod já vem populado de closingsWithDetails
                          return (
                            <div key={movement.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                <span>{movement.transactionType === "Receita" ? "➡️" : "⬅️"}</span>
                                <span className="text-sm">
                                  {movement.description}
                                  <span className={`text-xs ml-1 ${movement.transactionType === "Despesa" ? "text-red-500" : "text-green-500"}`}>
                                    ({movement.transactionType})
                                  </span>
                                </span>
                                {method && (
                                  <Badge variant="outline" className="text-xs">
                                    {method.icon} {method.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-medium">
                                  {formatCurrency(movement.amount)}
                                </span>
                                {movement.discount > 0 && (
                                  <span className="text-xs text-red-500 block">
                                    Desconto: {formatCurrency(movement.discount)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Não houve movimentações neste fechamento.
                        </p>
                      )}
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
