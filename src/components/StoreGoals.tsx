import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Store, StoreMeta, StoreClosing } from "@/types/store";
import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency } from "@/utils/formatters";
import { Label } from "@/components/ui/label"; // 1. Importar o Label
import { cn } from "@/lib/utils"; // Importar cn
import { useToast } from "@/hooks/use-toast";

interface StoreGoalsProps {
  stores: Store[];
  goals: StoreMeta[];
  closings: StoreClosing[];
  onAddGoal: (goal: Omit<StoreMeta, "id" | "createdAt">) => void;
  onUpdateGoal: (id: string, goal: Partial<StoreMeta>) => void;
  onDeleteGoal: (id: string) => void;
}

export const StoreGoals = ({
  stores,
  goals,
  closings,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}: StoreGoalsProps) => {
  const [newGoal, setNewGoal] = useState({
    storeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    targetRevenue: 0,
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGoal.storeId || newGoal.targetRevenue <= 0) {
      toast({
        title: "Erro",
        description: "Selecione uma loja e defina uma meta válida",
        variant: "destructive",
      });
      return;
    }

    // Verificar se já existe meta para esta loja no mês/ano
    const existingGoal = goals.find(
      (g) =>
        g.storeId === newGoal.storeId &&
        g.month === newGoal.month &&
        g.year === newGoal.year
    );

    if (existingGoal) {
      onUpdateGoal(existingGoal.id, { targetRevenue: newGoal.targetRevenue });
      toast({
        title: "Meta atualizada",
        description: "Meta da loja foi atualizada com sucesso!",
      });
    } else {
      onAddGoal(newGoal);
      toast({
        title: "Meta criada",
        description: "Meta da loja foi criada com sucesso!",
      });
    }

    setNewGoal({
      storeId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      targetRevenue: 0,
    });
  };

  const getStoreProgress = (storeId: string, month: number, year: number) => {
    const storeClosings = closings.filter((c) => {
      const closingDate = new Date(c.closingDate);
      return (
        c.storeId === storeId &&
        closingDate.getMonth() + 1 === month &&
        closingDate.getFullYear() === year
      );
    });

    const currentRevenue = storeClosings.reduce(
      (sum, c) => sum + c.totalEntradas,
      0
    );
    return currentRevenue;
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Metas das Lojas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form to add new goal */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store-select">Selecione a loja *</Label>{" "}
              {/* 2. Adicionar o Label aqui */}
              <Select
                value={newGoal.storeId}
                onValueChange={(value) =>
                  setNewGoal((prev) => ({ ...prev, storeId: value }))
                }
              >
                {" "}
                {/* 3. Remover o 'label' prop do Select */}
                <SelectTrigger id="store-select">
                  {" "}
                  {/* 2. Adicione um 'id' ao SelectTrigger */}
                  <SelectValue placeholder="Selecione a loja..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.icon || "🏪"} {store.name}{" "}
                      {store.nickname && `(${store.nickname})`}
                    </SelectItem>
                  ))}
                  {/* 3. (Opcional) Consideração para quando 'stores' estiver vazio */}
                  {stores.length === 0 && (
                    <SelectItem value="no-stores" disabled>
                      Nenhuma loja disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <CurrencyInput
                label="Meta de faturamento"
                value={newGoal.targetRevenue}
                onChange={(value) =>
                  setNewGoal((prev) => ({ ...prev, targetRevenue: value }))
                }
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                value={newGoal.month.toString()}
                onValueChange={(value) =>
                  setNewGoal((prev) => ({ ...prev, month: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={newGoal.year.toString()}
                onValueChange={(value) =>
                  setNewGoal((prev) => ({ ...prev, year: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - 2 + i
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {goals.some(
              (g) =>
                g.storeId === newGoal.storeId &&
                g.month === newGoal.month &&
                g.year === newGoal.year
            )
              ? "Atualizar Meta"
              : "Definir Meta"}
          </Button>
        </form>

        {/* Goals list */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">
            Acompanhamento das Metas
          </h4>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma meta definida
              </p>
            ) : (
              goals.map((goal) => {
                const store = stores.find((s) => s.id === goal.storeId);
                if (!store) return null;

                const currentRevenue = getStoreProgress(
                  goal.storeId,
                  goal.month,
                  goal.year
                );
                const progressPercentage = getProgressPercentage(
                  currentRevenue,
                  goal.targetRevenue
                );

                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "p-4 border rounded-lg hover:shadow-md transition-shadow",
                      progressPercentage >= 100
                        ? "bg-green-50 border-green-200"
                        : progressPercentage < 50
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{store.icon || "🏪"}</span>
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-gray-500">
                            {months[goal.month - 1]} de {goal.year}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onDeleteGoal(goal.id);
                          toast({
                            title: "Meta removida",
                            description: `A meta de ${store.name} foi removida com sucesso.`,
                          });
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Meta:</span>
                          <p className="font-semibold text-lg">
                            {formatCurrency(goal.targetRevenue)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">Realizado:</span>
                          <p className="font-semibold text-lg text-green-600">
                            {formatCurrency(currentRevenue)}
                          </p>
                        </div>
                      </div>

                      {goal.targetRevenue > currentRevenue && (
                        <p className="text-sm text-gray-600 text-center">
                          Faltam{" "}
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(
                              goal.targetRevenue - currentRevenue
                            )}
                          </span>{" "}
                          para atingir a meta.
                        </p>
                      )}

                      <Progress value={progressPercentage} className="h-3" />

                      <div className="flex justify-between items-center">
                        <Badge
                          variant={
                            progressPercentage < 30
                              ? "outline" // Menos de 30%
                              : progressPercentage < 70
                              ? "secondary" // Entre 30% e 70%
                              : "default" // Mais de 70%
                          }
                        >
                          {progressPercentage.toFixed(1)}% da meta
                        </Badge>

                        <span
                          className={`text-sm font-medium ${
                            progressPercentage >= 100
                              ? "text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          {currentRevenue >= goal.targetRevenue
                            ? "✅ Meta atingida!"
                            : `Faltam ${formatCurrency(
                                goal.targetRevenue - currentRevenue
                              )}`}
                          {/* Ajuste para mostrar "Meta atingida!" apenas quando >= 100% */}
                          {progressPercentage >= 100 && (
                            <span className="ml-1">✅ Meta atingida!</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
