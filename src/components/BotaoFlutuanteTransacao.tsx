import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const BotaoFlutuanteTransacao: React.FC = () => {
  const [fabAberto, setFabAberto] = useState(false);
  const navigate = useNavigate();

  const navegarParaTransacao = (tipo: 'despesa' | 'receita') => {
    setFabAberto(false);
    navigate(`/transacao?tipo=${tipo}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {fabAberto && (
        <div className="absolute bottom-16 right-0 space-y-3 mb-2">
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navegarParaTransacao('receita')}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
              title="Nova Receita"
            >
              <TrendingUp className="h-6 w-6" />
            </Button>
            <Button
              onClick={() => navegarParaTransacao('despesa')}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
              title="Nova Despesa"
            >
              <TrendingDown className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
      
      <Button
        onClick={() => setFabAberto(!fabAberto)}
        className={`bg-gray-800 hover:bg-gray-700 text-white rounded-full w-16 h-16 shadow-lg transition-transform duration-200 ${fabAberto ? 'rotate-45' : ''}`}
      >
        <Plus className="h-8 w-8" />
      </Button>
    </div>
  );
};
