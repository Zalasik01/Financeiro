import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Base } from "@/types/store"; // Alterado de Store para Base
import { Shield, Building, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Importar useAuth

interface AccessSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bases: Base[]; // Alterado de stores para bases
  isAdmin: boolean; // Nova prop para controlar a exibição do link admin
}

export const AccessSelectionModal: React.FC<AccessSelectionModalProps> = ({
  isOpen,
  onClose,
  bases, // Alterado de stores para bases
  isAdmin,
}) => {
  const { setSelectedBaseId, currentUser } = useAuth(); // Obter a função e currentUser
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    // setSelectedBaseId já será chamado no onClick do botão da base
    onClose();
    navigate(path);
  };

  const handleCloseWithoutSelection = () => {
    onClose(); // Chamar onClose para fechar o modal
    if (currentUser?.isAdmin) {
      // Limpa a base selecionada apenas para admin se ele não escolher uma
      setSelectedBaseId(null);
    }
    // Remover navigate("/") - o modal deve apenas fechar, revelando a página subjacente.
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseWithoutSelection}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAdmin ? (
              <Shield size={24} className="text-primary" />
            ) : (
              <Building size={24} className="text-primary" />
            )}
            {isAdmin ? "Acesso Administrativo" : "Selecionar Base"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Selecione a área que deseja acessar ou continue para a visão geral."
              : "Selecione uma base para continuar ou vá para a visão geral."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleNavigate("/admin/store-management")}
            >
              <Shield size={18} />
              Painel Administrativo
            </Button>
          )}
          {bases.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Acessar Base Específica:
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {bases.map((base) => (
                  <Button
                    key={base.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-left h-auto py-2"
                    onClick={() => {
                      console.log(`Acessando base: ${base.name}`);
                      setSelectedBaseId(base.id); // Definir a base selecionada
                      handleNavigate("/"); // Ou para uma rota específica da base: `/base/${base.id}`
                    }}
                  >
                    <Building size={18} /> {/* Ícone genérico para base */}
                    <span className="flex-1">
                      {base.numberId !== undefined ? `${base.numberId}-` : ""}
                      {base.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
