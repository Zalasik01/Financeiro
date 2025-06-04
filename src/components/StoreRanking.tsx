import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StoreRanking as StoreRankingType } from "@/types/store";
import { formatCurrency } from "@/utils/formatters";

interface StoreRankingProps {
  rankings: StoreRankingType[];
}

export const StoreRanking = ({ rankings }: StoreRankingProps) => {
  const [sortBy, setSortBy] = useState<
    "totalRevenue" | "totalClosings" | "totalExpenses" | "averageBalance"
  >("totalRevenue");

  const sortedRankings = [...rankings].sort((a, b) => {
    switch (sortBy) {
      case "totalRevenue":
        return b.totalRevenue - a.totalRevenue;
      case "totalClosings":
        return b.totalClosings - a.totalClosings;
      case "totalExpenses":
        return b.totalExpenses - a.totalExpenses;
      case "averageBalance":
        return b.averageBalance - a.averageBalance;
      default:
        return 0;
    }
  });

  const getSortLabel = (key: string) => {
    const labels = {
      totalRevenue: "Receitas",
      totalClosings: "Fechamentos",
      totalExpenses: "Despesas",
      averageBalance: "Saldo Médio",
    };
    return labels[key as keyof typeof labels];
  };

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `${position}º`;
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">🏆 Ranking de Lojas</span>
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalRevenue">Receitas</SelectItem>
              <SelectItem value="totalClosings">Fechamentos</SelectItem>
              <SelectItem value="totalExpenses">Despesas</SelectItem>
              <SelectItem value="averageBalance">Saldo Médio</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedRankings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma loja com dados disponíveis
            </p>
          ) : (
            sortedRankings.map((ranking, index) => (
              <div
                key={ranking.store.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                  index < 3
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold">
                    {getRankingIcon(index + 1)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {ranking.store.icon || "🏪"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{ranking.store.name}</p>
                        {ranking.store.nickname && (
                          <Badge variant="secondary" className="text-xs">
                            {ranking.store.nickname}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {ranking.totalClosings} fechamentos
                        {ranking.lastClosingDate && (
                          <span>
                            {" "}
                            • Último:{" "}
                            {new Date(
                              ranking.lastClosingDate
                            ).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg">
                    {sortBy === "totalClosings"
                      ? ranking.totalClosings
                      : formatCurrency(ranking[sortBy])}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getSortLabel(sortBy)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
