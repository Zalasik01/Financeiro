import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, FileText } from "lucide-react";

interface BaseActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  onContract: () => void;
  editTitle?: string;
  deleteTitle?: string;
  contractTitle?: string;
}

export const BaseActionButtons: React.FC<BaseActionButtonsProps> = ({
  onEdit,
  onDelete,
  onContract,
  editTitle = "Editar",
  deleteTitle = "Remover",
  contractTitle = "Imprimir Contrato"
}) => {
  return (
    <div className="flex justify-center gap-1">
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
        onClick={(e) => {
          e.stopPropagation();
          onContract();
        }} 
        title={contractTitle}
        className="text-blue-500 hover:text-blue-700"
      >
        <FileText className="h-4 w-4" />
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
