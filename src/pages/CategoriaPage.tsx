import React from "react";
import { useFinance } from "@/hooks/useFinance";
import { CategoryManager } from "@/components/CategoryManager";

const CategoriaPage: React.FC = () => {
  const { categories, addCategory, deleteCategory } = useFinance();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Categorias</h1>
      <CategoryManager
        categories={categories}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
      />
    </div>
  );
};

export default CategoriaPage;
