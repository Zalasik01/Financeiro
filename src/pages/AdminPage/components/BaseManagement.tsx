import React, { useState, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase";
import { ref, set, push, serverTimestamp } from "firebase/database";
import { Copy, Send, PlusCircle, List, UserX, Info } from "lucide-react";

interface AuthorizedUser {
  displayName: string;
  email: string;
}

export interface ClientBase {
  id: string;
  name: string;
  numberId: number;
  authorizedUIDs: { [key: string]: AuthorizedUser };
  createdAt: number;
  createdBy: string;
}

interface BaseManagementProps {
  clientBases: ClientBase[];
  nextNumberId: number | null;
  baseCreatorsMap: { [uid: string]: string };
  onGenerateInviteLink: (base: ClientBase) => void;
  generatedInviteLink: string | null;
  onSetUserToRemove: (user: { user: { uid: string; displayName: string }; base: ClientBase } | null) => void;
}

export const BaseManagement: React.FC<BaseManagementProps> = ({
  clientBases,
  nextNumberId,
  baseCreatorsMap,
  onGenerateInviteLink,
  generatedInviteLink,
  onSetUserToRemove,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newBaseName, setNewBaseName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddClientBase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBaseName.trim() || !currentUser || nextNumberId === null) {
      toast({ title: "Erro", description: "Nome da base é obrigatório.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const clientBasesRef = ref(db, "clientBases");
    const newClientBaseRef = push(clientBasesRef);

    const authorizedUIDsObject: { [key: string]: AuthorizedUser } = {
      [currentUser.uid]: {
        displayName: currentUser.displayName || "Admin",
        email: currentUser.email || "Não informado",
      },
    };

    const baseData: Omit<ClientBase, "id"> = {
      name: newBaseName,
      numberId: nextNumberId,
      authorizedUIDs: authorizedUIDsObject,
      createdAt: serverTimestamp() as any,
      createdBy: currentUser.uid,
    };

    try {
      await set(newClientBaseRef, baseData);
      toast({ title: "Sucesso!", description: `Base "${newBaseName}" criada com ID ${nextNumberId}.` });
      setNewBaseName("");
    } catch (error) {
      console.error("Erro ao criar base:", error);
      toast({ title: "Erro ao criar base", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><List className="h-6 w-6" /> Gerenciar Bases de Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAddClientBase} className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Criar Nova Base</h3>
          <div>
            <Label htmlFor="baseName">Nome da Base *</Label>
            <Input id="baseName" value={newBaseName} onChange={(e) => setNewBaseName(e.target.value)} placeholder="Ex: Cliente Alpha" required />
          </div>
          <div>
            <Label htmlFor="baseNumberId">ID Numérico (Automático)</Label>
            <Input id="baseNumberId" value={nextNumberId ?? "Carregando..."} readOnly disabled />
          </div>
          <Button type="submit" disabled={isLoading || nextNumberId === null} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Criando..." : "Criar Base"}
          </Button>
        </form>

        {generatedInviteLink && (
          <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Link de Convite Gerado!</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input type="text" value={generatedInviteLink} readOnly className="mt-1 bg-white dark:bg-slate-800 flex-grow" onClick={(e) => (e.target as HTMLInputElement).select()} />
              <Button variant="outline" size="sm" className="mt-2 sm:mt-1" onClick={() => navigator.clipboard.writeText(generatedInviteLink).then(() => toast({ description: "Link copiado!", variant: "success" })).catch(() => toast({ description: "Falha ao copiar.", variant: "destructive" }))}>
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">Bases Existentes</h3>
          {clientBases.length === 0 ? (
            <p>Nenhuma base de cliente cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {clientBases.sort((a, b) => (a.numberId || 0) - (b.numberId || 0)).map((base, index) => (
                <li key={base.id} className={`p-4 border rounded-lg flex flex-col justify-between gap-3 bg-slate-100 dark:bg-slate-700 shadow-sm`}>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-primary">{base.name}</span>
                        <Badge variant="secondary">ID: {base.numberId}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onGenerateInviteLink(base)}>
                        <Send className="mr-2 h-4 w-4" /> Gerar Convite
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Criado por: {baseCreatorsMap[base.createdBy] || base.createdBy} em {new Date(base.createdAt).toLocaleDateString('pt-BR')}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium">Usuários Autorizados:</h4>
                      {base.authorizedUIDs && Object.keys(base.authorizedUIDs).length > 0 ? (
                        <ul className="mt-1 space-y-1">
                          {Object.entries(base.authorizedUIDs).map(([uid, authData]) => (
                            <li key={uid} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 bg-slate-200 dark:bg-slate-700/50 p-2 rounded-md">
                              <span>
                                <span className="font-semibold">Nome:</span> {authData.displayName || 'Nome Desconhecido'} | <span className="font-semibold">E-mail:</span> ({authData.email || 'Email Desconhecido'})
                              </span>
                              {Object.keys(base.authorizedUIDs).length > 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSetUserToRemove({ user: { uid, displayName: authData.displayName || `Usuário (UID: ${uid.substring(0,6)}...)` }, base })}>
                                  <UserX className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (<p className="text-sm text-gray-500 mt-1">Nenhum usuário autorizado nesta base.</p>)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};