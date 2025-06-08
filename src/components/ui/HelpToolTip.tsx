import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { DICAS, Dica } from "@/components/dicas"; // Importar as dicas

interface HelpTooltHipProps {
  dicaKey: keyof typeof DICAS;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export const HelpTooltip: React.FC<HelpTooltHipProps> = ({
  dicaKey,
  children,
  className,
  side = "right",
}) => {
  const dica: Dica | undefined = DICAS[dicaKey];

  if (!dica) {
    console.warn(`[HelpTooltip] Chave de dica não encontrada: ${dicaKey}`);
    return null; 
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <HelpCircle
              className={`h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help ml-1 ${className}`}
              aria-label={`Ajuda: ${dica.titulo || 'Informação adicional'}`}
            />
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs bg-gray-800 text-white p-3 rounded-md shadow-lg z-50">
          {dica.titulo && (
            <p className="font-semibold text-sm mb-1">{dica.titulo}</p>
          )}
          <p className="text-xs">{dica.conteudo}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};