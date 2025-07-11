import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Base } from "@/types/store";

// Estender Base para incluir propriedades que podem estar presentes
type ExtendedBase = Base & {
  ativo?: boolean;
};

import {
  ArrowRight,
  Building,
  Frown,
  LogOut,
  Search,
  Shield,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface AccessSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBase: (baseId: string) => void;
  bases: ExtendedBase[];
  isAdmin: boolean;
}

export const AccessSelectionModal: React.FC<AccessSelectionModalProps> =
  React.memo(
    ({ isOpen, onClose, onSelectBase, bases, isAdmin }) => {
      const [searchTerm, setSearchTerm] = useState("");

      const filteredBases = useMemo(() => {
        if (!bases) return [];
        return bases.filter(
          (base) =>
            base.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            base.numberId?.toString().includes(searchTerm)
        );
      }, [bases, searchTerm]);

      const handleSelectBase = (baseId: string) => {
        onSelectBase(baseId);
      };

      useEffect(() => {
        if (!isOpen) {
          setSearchTerm("");
        }
      }, [isOpen]);

      // Simples verificação de abertura
      if (!isOpen) {
        return null;
      }

      const renderContent = () => {
        if (bases.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/50 rounded-lg">
              <Frown className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground">
                Nenhuma Base Encontrada
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin
                  ? "Nenhuma base foi criada ainda. Acesse o painel de administração para criar bases."
                  : "Você não tem permissão para acessar nenhuma base."}
              </p>
              <Button variant="outline" className="mt-4" onClick={onClose}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          );
        }

        if (filteredBases.length === 0 && bases.length > 0) {
          return (
            <p className="text-center text-sm text-muted-foreground p-4">
              Nenhum resultado encontrado.
            </p>
          );
        }

        return (
          <div className="max-h-48 overflow-y-auto space-y-1 pr-2 -mr-2">
            {filteredBases.map((base) => (
              <button
                key={base.id}
                onClick={() => handleSelectBase(base.id)}
                className="w-full group flex items-center justify-between text-left p-3 rounded-md hover:bg-muted transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted/70 group-hover:bg-background rounded-md transition-all">
                    <Building
                      size={18}
                      className="text-muted-foreground group-hover:text-primary transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {base.numberId ? `${base.numberId} - ` : ""}
                      {base.name}
                    </span>
                    <span
                      title={base.ativo ? "Ativa" : "Inativa"}
                      className={`h-2.5 w-2.5 rounded-full ${
                        base.ativo ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </button>
            ))}
          </div>
        );
      };

      return (
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) {
              onClose();
            }
          }}
        >
          <DialogContent
            className="max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Shield size={22} className="text-primary" />
                Acesso ao Sistema
              </DialogTitle>
              <DialogDescription>
                {isAdmin
                  ? "Selecione a base que deseja gerenciar ou acesse através do menu."
                  : "Selecione a base que deseja acessar."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <div className="flex flex-col gap-3">
                {bases.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar por nome ou número..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                {renderContent()}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    },
    (prevProps, nextProps) => {
      // Estratégia simples: NUNCA re-criar o componente se isOpen for true em ambos
      // Apenas permitir re-criação quando mudança de fechado para aberto
      if (prevProps.isOpen && nextProps.isOpen) {
        // Se ambos estão abertos, NUNCA re-renderizar para evitar duplicação
        return true; // true = NÃO re-renderizar
      }

      // Só permitir re-renderização quando há mudança real de abertura/fechamento
      return prevProps.isOpen === nextProps.isOpen; // true = NÃO re-renderizar se iguais
    }
  );
