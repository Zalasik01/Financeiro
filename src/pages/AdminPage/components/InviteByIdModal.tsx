import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ClientBase } from "@/types/store";
import { AlertCircle, Copy, Send } from "lucide-react";
import React, { useState } from "react";

interface InviteByIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientBases: ClientBase[];
  onGenerateInviteLink: (base: ClientBase) => void;
  generatedInviteLink: string | null;
}

export const InviteByIdModal: React.FC<InviteByIdModalProps> = ({
  isOpen,
  onClose,
  clientBases,
  onGenerateInviteLink,
  generatedInviteLink,
}) => {
  const [baseId, setBaseId] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleGenerateInvite = () => {
    setError("");

    if (!baseId.trim()) {
      setError("Por favor, informe o ID da base.");
      return;
    }

    const numberId = parseInt(baseId.trim(), 10);
    if (isNaN(numberId)) {
      setError("ID deve ser um número válido.");
      return;
    }

    const foundBase = clientBases.find((base) => base.numberId === numberId);
    if (!foundBase) {
      setError(`Nenhuma base encontrada com ID ${numberId}.`);
      return;
    }

    if (!foundBase.ativo) {
      setError(
        `A base "${foundBase.name}" (ID: ${numberId}) está inativa. Não é possível gerar convite.`
      );
      return;
    }

    onGenerateInviteLink(foundBase);
  };

  const handleCopyLink = async () => {
    if (!generatedInviteLink) return;

    try {
      await navigator.clipboard.writeText(generatedInviteLink);
      toast({
        title: "Sucesso!",
        description: "Link copiado para a área de transferência!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setBaseId("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Convite por ID da Base</DialogTitle>
          <DialogDescription>
            Informe o ID numérico da base para gerar um link de convite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="baseId">ID da Base</Label>
            <Input
              id="baseId"
              type="number"
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              placeholder="Ex: 1, 2, 3..."
              className="mt-1"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedInviteLink && (
            <Alert>
              <Send className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Link de convite gerado:</p>
                  <div className="flex gap-2">
                    <Input
                      value={generatedInviteLink}
                      readOnly
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button onClick={handleGenerateInvite}>
            <Send className="mr-2 h-4 w-4" />
            Gerar Convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
