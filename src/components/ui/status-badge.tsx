import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  activeText = "Ativo",
  inactiveText = "Inativo"
}) => {
  if (isActive === false) {
    return (
      <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700 border border-red-300">
        {inactiveText}
      </span>
    );
  }
  
  return (
    <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700 border border-green-300">
      {activeText}
    </span>
  );
};
