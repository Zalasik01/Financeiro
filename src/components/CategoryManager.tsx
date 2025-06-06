import { useState } from "react";
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
import { Category } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, "id" | "createdAt">) => void;
  onDeleteCategory: (id: string) => void;
}

const categoryIcons = [
  "💰",
  "🍽️",
  "🚗",
  "🏠",
  "💻",
  "🎯",
  "🎮",
  "📱",
  "👔",
  "🏥",
  "📚",
  "✈️",
];
const categoryColors = [
  "#10B981",
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

export const CategoryManager = ({
  categories,
  onAddCategory,
  onDeleteCategory,
}: CategoryManagerProps) => {
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    icon: "💰",
    color: "#10B981",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    onAddCategory(newCategory);
    setNewCategory({
      name: "",
      type: "expense",
      icon: "💰",
      color: "#10B981",
    });

    toast({
      title: "Sucesso",
      description: "Categoria criada com sucesso!",
      variant: "success",
    });
  };

  const handleDelete = (id: string, name: string) => {
    onDeleteCategory(id);
    toast({
      title: "Categoria removida",
      description: `A categoria "${name}" foi removida com sucesso.`,
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏷️ Gerenciar Categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form to add new category */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Alimentação"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={newCategory.type}
                onValueChange={(value: "income" | "expense") =>
                  setNewCategory((prev) => ({ ...prev, type: value }))
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categoryIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`p-2 rounded-lg border-2 hover:scale-110 transition-transform ${
                      newCategory.icon === icon
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() =>
                      setNewCategory((prev) => ({ ...prev, icon }))
                    }
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categoryColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      newCategory.color === color
                        ? "border-gray-800"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setNewCategory((prev) => ({ ...prev, color }))
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Adicionar Categoria
          </Button>
        </form>

        {/* Categories list */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Categorias Existentes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <Badge
                      style={{ backgroundColor: category.color }}
                      className="text-xs text-white"
                    >
                      {category.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id, category.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
