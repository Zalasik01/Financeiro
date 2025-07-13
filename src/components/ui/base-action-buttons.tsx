import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Ban, FileText } from "lucide-react";

interface BaseActionButtonsProps {
  onEdit: () => void;
  onInactivate: () => void;
  onContract: () => void;
  editTitle?: string;
  inactivateTitle?: string;
  contractTitle?: string;
}

export const BaseActionButtons: React.FC<BaseActionButtonsProps> = ({
  onEdit,
  onInactivate,
  onContract,
  editTitle = "Editar",
  inactivateTitle = "Inativar",
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
          onInactivate();
        }} 
        title={inactivateTitle}
      >
        <Ban className="h-4 w-4" />
      </Button>
    </div>
  );
};
