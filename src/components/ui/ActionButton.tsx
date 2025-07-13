import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface ActionButtonProps {
  type: 'edit' | 'delete';
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  type,
  onClick,
  disabled = false,
  size = 'sm',
  tooltip
}) => {
  const isEdit = type === 'edit';
  const Icon = isEdit ? Edit : Trash2;
  
  const baseClasses = "p-2 transition-all duration-200 border-0";
  const hoverClasses = isEdit 
    ? "hover:bg-blue-100 hover:text-blue-700" 
    : "hover:bg-red-100 hover:text-red-700";
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  const buttonSize = size === 'md' ? 'sm' : size === 'lg' ? 'lg' : 'sm';

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`${baseClasses} ${hoverClasses} ${sizeClasses[size]}`}
    >
      <Icon size={16} />
    </Button>
  );
};
