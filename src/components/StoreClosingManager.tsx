import { useState, useMemo, useEffect } from "react";
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
  MovementItem,
} from "@/types/store";
import { useToast } from "@/hooks/use-toast";
import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency } from "@/utils/formatters";
import { ChevronDown } from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { HelpTooltip } from "@/components/ui/HelpToolTip";

interface StoreClosingManagerProps {
  stores: Store[];
  closings: StoreClosing[];
  paymentMethods: PaymentMethod[];
  onAddClosing: (
    closing: Omit<
      StoreClosing,
      | "id"
      | "createdAt"
      | "totalEntradas"
      | "totalSaidas"
      | "totalOutros"
      | "netResult"
    > & { movements: MovementItem[] }
  ) => void;
  onUpdateClosing: (id: string, closing: Partial<StoreClosing>) => void;
  onDeleteClosing: (id: string) => void;
}

export const StoreClosingManager = ({
  stores,
  closings,
  paymentMethods,
  onAddClosing,
  onUpdateClosing,
  onDeleteClosing,
}: StoreClosingManagerProps) => {
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

  const [sortBy, setSortBy] = useState<string>("date-desc");

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

  const [finalBalanceEdited, setFinalBalanceEdited] = useState(false);

  const [suggestedFinalBalance, setSuggestedFinalBalance] = useState(0);

  useEffect(() => {
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
        transactionType: t.type,
        paymentMethodId: "N/A",
        createdAt: t.createdAt,
      }));

    const allMovementsForSuggestion = [
      ...newClosing.movements,
      ...movementsFromPersonalTransactions,
    ];

    const totalEntradas = allMovementsForSuggestion
      .filter((m) => m.transactionType === "Receita")
      .reduce((sum, m) => sum + m.amount - (m.discount || 0), 0);

    const totalSaidas = allMovementsForSuggestion
      .filter((m) => m.transactionType === "Despesa")
      .reduce((sum, m) => sum + m.amount, 0);

    const suggestion = newClosing.initialBalance + totalEntradas - totalSaidas;
    setSuggestedFinalBalance(suggestion);

    if (!finalBalanceEdited) {
      setNewClosing((prev) => ({
        ...prev,
        finalBalance: suggestion,
      }));
    }
  }, [
    newClosing.initialBalance,
    newClosing.movements,
    personalTransactions,
    newClosing.storeId,
    newClosing.closingDate,
    finalBalanceEdited,
  ]);

  useEffect(() => {
    setFinalBalanceEdited(false);
  }, [
    newClosing.initialBalance,
    newClosing.movements,
    personalTransactions,
    newClosing.storeId,
    newClosing.closingDate,
  ]);

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
      relevantPersonalTransactions.map((t) => {
        const transactionTypeForMovement: "Receita" | "Despesa" =
          t.type === "Receita" ? "Receita" : "Despesa";
        return {
          id: `mov-from-trans-${t.id}`,
          description: t.description,
          amount: Math.abs(t.amount),
          discount: t.discount || 0,
          transactionType: transactionTypeForMovement,
          paymentMethodId: "N/A",
          createdAt: t.createdAt,
        };
      });

    onAddClosing({
      storeId: newClosing.storeId,
      closingDate: closingDateObj,
      initialBalance: newClosing.initialBalance,
      finalBalance: newClosing.finalBalance,
      movements: [
        ...newClosing.movements,
        ...movementsFromPersonalTransactions,
      ],
    });

    setNewClosing({
      storeId: "",
      closingDate: new Date().toISOString().split("T")[0],
      initialBalance: 0,
      finalBalance: 0,
      movements: [],
    });

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
      case "netResult-positive-priority-desc":
        sorted.sort((a, b) => {
          const aIsPositive = a.netResult >= 0;
          const bIsPositive = b.netResult >= 0;
          if (aIsPositive && !bIsPositive) return -1;
          if (!aIsPositive && bIsPositive) return 1;
          if (aIsPositive && bIsPositive) return b.netResult - a.netResult;
          return b.netResult - a.netResult;
        });
        break;
      case "netResult-positive-priority-asc":
        sorted.sort((a, b) => {
          const aIsPositive = a.netResult >= 0;
          const bIsPositive = b.netResult >= 0;
          if (aIsPositive && !bIsPositive) return -1;
          if (!aIsPositive && bIsPositive) return 1;
          if (aIsPositive && bIsPositive) return a.netResult - b.netResult;
          return a.netResult - b.netResult;
        });
        break;
      case "netResult-negative-priority-desc":
        sorted.sort((a, b) => {
          const aIsNegative = a.netResult < 0;
          const bIsNegative = b.netResult < 0;
          if (aIsNegative && !bIsNegative) return -1;
          if (!aIsNegative && bIsNegative) return 1;
          if (aIsNegative && bIsNegative) return b.netResult - a.netResult;
          return b.netResult - a.netResult;
        });
        break;
      case "netResult-negative-priority-asc":
        sorted.sort((a, b) => {
          const aIsNegative = a.netResult < 0;
          const bIsNegative = b.netResult < 0;
          if (aIsNegative && !bIsNegative) return -1;
          if (!aIsNegative && bIsNegative) return 1;
          if (aIsNegative && bIsNegative) return a.netResult - b.netResult;
          return a.netResult - b.netResult;
        });
        break;
      case "date-desc":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.closingDate).getTime() -
            new Date(a.closingDate).getTime()
        );
    }
    return sorted;
  }, [closings, sortBy]);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊 Fazer Fechamento</span>
          <HelpTooltip dicaKey="fazerFechamento" side="bottom" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-4 bg-gray-50 rounded-lg"
        >
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
                onFocus={() => {
                  if (!finalBalanceEdited) {
                    setNewClosing((prev) => ({ ...prev, finalBalance: 0 }));
                  }
                }}
                onChange={(value) => {
                  setFinalBalanceEdited(true);
                  setNewClosing((prev) => ({
                    ...prev,
                    finalBalance: value,
                  }));
                }}
                placeholder="R$ 0,00"
                required
                helpTooltipDicaKey="fechamentoSaldoFinal"
              />
            </div>
          </div>
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
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700">
              Fechamentos Registrados
            </h4>
            <div className="w-56">
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
                              className={`h-4 w-4 transition-transform ${
                                expandedClosingId === closing.id
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
                              description: `O fechamento da loja "${
                                closing.store?.name || "Desconhecida"
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
                          className={`font-medium ${
                            closing.netResult >= 0
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
                          const method = movement.paymentMethod;
                          return (
                            <div
                              key={movement.id}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <span>
                                  {movement.transactionType === "Receita"
                                    ? "➡️"
                                    : "⬅️"}
                                </span>
                                <span className="text-sm">
                                  {movement.description}
                                  <span
                                    className={`text-xs ml-1 ${
                                      movement.transactionType === "Despesa"
                                        ? "text-red-500"
                                        : "text-green-500"
                                    }`}
                                  >
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