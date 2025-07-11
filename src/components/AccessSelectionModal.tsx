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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      const navigate = useNavigate();
      const [searchTerm, setSearchTerm] = useState("");
      const renderCountRef = useRef(0);
      const modalIdRef = useRef(`modal-${Date.now()}-${Math.random()}`);

      // Incrementar contador de render a cada renderização
      renderCountRef.current += 1;

      console.log(
        `🔵 [AccessSelectionModal-${modalIdRef.current}] Render #${renderCountRef.current}:`,
        {
          isOpen,
          basesCount: bases?.length || 0,
          isAdmin,
          timestamp: new Date().toISOString(),
        }
      );

      const filteredBases = useMemo(() => {
        if (!bases) return [];
        return bases.filter(
          (base) =>
            base.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            base.numberId?.toString().includes(searchTerm)
        );
      }, [bases, searchTerm]);

      // Log para rastrear mudanças no estado do modal
      useEffect(() => {
        console.log(
          `🔍 [AccessSelectionModal-${modalIdRef.current}] Estado mudou:`,
          {
            isOpen,
            basesCount: bases?.length || 0,
            isAdmin,
            timestamp: new Date().toISOString(),
          }
        );
      }, [isOpen, bases, isAdmin]);

      // Log adicional para rastrear cada prop individualmente
      useEffect(() => {
        console.log(
          `📊 [AccessSelectionModal-${modalIdRef.current}] Props tracking - isOpen:`,
          isOpen
        );
      }, [isOpen]);

      useEffect(() => {
        console.log(
          `📊 [AccessSelectionModal-${modalIdRef.current}] Props tracking - bases length:`,
          bases?.length || 0
        );
      }, [bases]);

      useEffect(() => {
        console.log(
          `📊 [AccessSelectionModal-${modalIdRef.current}] Props tracking - isAdmin:`,
          isAdmin
        );
      }, [isAdmin]);

      const handleSelectBase = (baseId: string) => {
        console.log(
          `🎯 [AccessSelectionModal-${modalIdRef.current}] Base selecionada:`,
          baseId
        );
        onSelectBase(baseId);
      };

      useEffect(() => {
        if (!isOpen) {
          setSearchTerm("");
        }
      }, [isOpen]);

      // Debug: verificar quantos modais estão no DOM
      useEffect(() => {
        if (isOpen) {
          // Pequeno delay para garantir que o DOM foi atualizado
          setTimeout(() => {
            const modalsInDOM = document.querySelectorAll("[data-modal-id]");
            const dialogElements = document.querySelectorAll('[role="dialog"]');
            console.log(
              `🚨 [AccessSelectionModal-${modalIdRef.current}] DOM Debug:`,
              {
                modalsWithDataId: modalsInDOM.length,
                dialogElements: dialogElements.length,
                modalIds: Array.from(modalsInDOM).map((el) =>
                  el.getAttribute("data-modal-id")
                ),
                isThisModalOpen: isOpen,
              }
            );

            if (modalsInDOM.length > 1) {
              console.error(
                `🔴 PROBLEMA DETECTADO: ${modalsInDOM.length} modais encontrados no DOM!`
              );
            }
          }, 50);
        }
      }, [isOpen]);

      // Debug: verificar quantos modais estão no DOM
      useEffect(() => {
        if (isOpen) {
          // Pequeno delay para garantir que o DOM foi atualizado
          setTimeout(() => {
            const modalsInDOM = document.querySelectorAll("[data-modal-id]");
            const dialogElements = document.querySelectorAll('[role="dialog"]');
            console.log(
              `🚨 [AccessSelectionModal-${modalIdRef.current}] DOM Debug:`,
              {
                modalsWithDataId: modalsInDOM.length,
                dialogElements: dialogElements.length,
                modalIds: Array.from(modalsInDOM).map((el) =>
                  el.getAttribute("data-modal-id")
                ),
                isThisModalOpen: isOpen,
              }
            );

            if (modalsInDOM.length > 1) {
              console.error(
                `🔴 PROBLEMA DETECTADO: ${modalsInDOM.length} modais encontrados no DOM!`
              );
            }
          }, 50);
        }
      }, [isOpen]);

      // Simples verificação de abertura
      if (!isOpen) {
        console.log(
          `⏸️ [AccessSelectionModal-${modalIdRef.current}] Modal fechado`
        );
        return null;
      }

      console.log(
        `🎭 [AccessSelectionModal-${modalIdRef.current}] Renderizando modal:`,
        {
          isOpen,
          basesCount: bases?.length || 0,
          filteredBasesCount: filteredBases.length,
          isAdmin,
          renderCount: renderCountRef.current,
          modalId: modalIdRef.current,
        }
      );

      const renderContent = () => {
        if (bases.length === 0 && !isAdmin) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/50 rounded-lg">
              <Frown className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground">
                Nenhuma Base Encontrada
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Você não tem permissão para acessar nenhuma base.
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
            data-modal-id={modalIdRef.current}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Shield size={22} className="text-primary" />
                Acesso ao Sistema
              </DialogTitle>
              <DialogDescription>
                {isAdmin
                  ? "Escolha uma área ou uma base específica para gerenciar."
                  : "Selecione a base que deseja acessar."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-4">
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 p-6 text-base"
                  onClick={() => {
                    onClose();
                    navigate("/admin/store-management");
                  }}
                >
                  <Shield size={18} />
                  Painel do Administrador
                </Button>
              )}
              {isAdmin && bases.length > 0 && (
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <span className="relative bg-background px-2 text-xs uppercase text-muted-foreground">
                    Ou acesse uma base
                  </span>
                </div>
              )}
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
      // Comparação personalizada para evitar re-renderizações desnecessárias
      const isOpenChanged = prevProps.isOpen !== nextProps.isOpen;
      const isAdminChanged = prevProps.isAdmin !== nextProps.isAdmin;

      // IGNORAR mudanças nas funções de callback já que agora são estáveis
      // const onCloseChanged = prevProps.onClose !== nextProps.onClose;
      // const onSelectBaseChanged = prevProps.onSelectBase !== nextProps.onSelectBase;

      // Só considerar mudança de bases se o modal estiver aberto E o array realmente mudou
      const basesChanged =
        prevProps.isOpen &&
        nextProps.isOpen &&
        (prevProps.bases?.length !== nextProps.bases?.length ||
          // Verificação mais profunda: comparar IDs das bases se o tamanho for igual
          (prevProps.bases?.length === nextProps.bases?.length &&
            prevProps.bases?.some(
              (base, index) => base.id !== nextProps.bases?.[index]?.id
            )));

      const shouldRerender = isOpenChanged || isAdminChanged || basesChanged;

      console.log("🔄 [AccessSelectionModal] React.memo comparação:", {
        shouldRerender,
        isOpenChanged,
        isAdminChanged,
        callbacksIgnored: true, // Agora ignoramos mudanças nas funções
        basesChanged,
        prevOpen: prevProps.isOpen,
        nextOpen: nextProps.isOpen,
        prevBasesLength: prevProps.bases?.length || 0,
        nextBasesLength: nextProps.bases?.length || 0,
        timestamp: new Date().toISOString(),
      });

      return !shouldRerender; // Return true para NÃO re-renderizar
    }
  );
