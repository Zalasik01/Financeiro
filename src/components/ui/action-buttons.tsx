import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  editTitle?: string;
  deleteTitle?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  editTitle = "Editar",
  deleteTitle = "Remover"
}) => {
  return (
    <div className="flex justify-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }} 
        title={editTitle}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-red-500 hover:text-red-700" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }} 
        title={deleteTitle}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
