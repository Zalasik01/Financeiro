import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span role="img" aria-label="life buoy">
              🆘
            </span>{" "}
            Ajuda do Sistema
          </DialogTitle>
          <DialogDescription>
            Informações úteis e atalhos para facilitar sua navegação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold text-gray-700">Sobre o Sistema</h4>
            <p className="text-sm text-gray-600">
              Este é um sistema de gestão financeira projetado para ajudar você
              a controlar suas finanças pessoais e empresariais de forma
              eficiente.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Teclas de Atalho</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>
                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  Espaço
                </kbd>
                : Navegar para a tela de Transações.
              </li>
              {/* Adicione mais atalhos aqui conforme necessário */}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Dicas Gerais</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>
                Mantenha suas categorias organizadas para melhores relatórios.
              </li>
              <li>
                Realize fechamentos de loja regularmente para um controle
                preciso.
              </li>
              <li>
                Utilize as metas para acompanhar o progresso financeiro de suas
                lojas.
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
