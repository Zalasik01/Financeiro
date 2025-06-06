import React, { useState } from "react";
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
import { MovementType } from "@/types/store";
import { useToast } from "@/hooks/use-toast";

interface MovementTypeManagerProps {
  movementTypes: MovementType[];
  onAddMovementType: (method: Omit<MovementType, "id" | "createdAt">) => void;
  onDeleteMovementType: (id: string) => void;
}

const typeIcons = ["➡️", "⬅️", "🔄", "📦", "💸", "📋", "➕", "➖"];
const typeColors = [
  "#34D399", // entrada (green)
  "#F87171", // saida (red)
  "#60A5FA", // outros (blue)
  "#FBBF24", // yellow
  "#A78BFA", // purple
  "#2DD4BF", // teal
  "#84CC16", // lime
  "#EC4899", // pink
];

export const MovementTypeManager: React.FC<MovementTypeManagerProps> = ({
  movementTypes,
  onAddMovementType,
  onDeleteMovementType,
}) => {
  const [newMovementType, setNewMovementType] = useState({
    name: "",
    category: "outros" as MovementType["category"],
    icon: "🔄", // Default icon
    color: "#60A5FA", // Default color
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMovementType.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do tipo de movimentação é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    onAddMovementType(newMovementType);

    setNewMovementType({
      name: "",
      category: "outros",
      icon: "🔄",
      color: "#60A5FA",
    });

    toast({
      title: "Sucesso",
      description: "Tipo de movimentação adicionado!",
      variant: "success",
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔄 Gerenciar Tipos de Movimentação (Loja)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div>
            <Label htmlFor="movementTypeName">Nome *</Label>
            <Input
              id="movementTypeName"
              value={newMovementType.name}
              onChange={(e) =>
                setNewMovementType((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Ex: Venda, Sangria, Despesa"
              required
            />
          </div>
          <div>
            <Label htmlFor="movementTypeCategory">Categoria</Label>
            <Select
              value={newMovementType.category}
              onValueChange={(value: MovementType["category"]) =>
                setNewMovementType((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="movementTypeIcon">Ícone</Label>
            <Select
              value={newMovementType.icon}
              onValueChange={(value: string) =>
                setNewMovementType((prev) => ({ ...prev, icon: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeIcons.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="movementTypeColor">Cor</Label>
            <Input
              id="movementTypeColor"
              type="color"
              value={newMovementType.color}
              onChange={(e) =>
                setNewMovementType((prev) => ({
                  ...prev,
                  color: e.target.value,
                }))
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Adicionar Tipo
          </Button>
        </form>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">
            Tipos Existentes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {movementTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{type.icon}</span>
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <Badge
                      style={{ backgroundColor: type.color }}
                      className="text-white text-xs"
                    >
                      {type.category}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteMovementType(type.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
