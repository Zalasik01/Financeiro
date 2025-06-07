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
import { ref, set, push, serverTimestamp, update, remove } from "firebase/database";
import { Copy, Send, PlusCircle, List, UserX, Info, Save, Trash2, Power, PowerOff } from "lucide-react"; // Adicionar Power, PowerOff
import type { ClientBase } from "@/types/store"; // Importar a interface ClientBase

interface BaseManagementProps {
  clientBases: ClientBase[];
  nextNumberId: number | null;
  baseCreatorsMap: { [uid: string]: string };
  onGenerateInviteLink: (base: ClientBase) => void;
  generatedInviteLink: string | null;
  onSetUserToRemove: (user: { user: { uid: string; displayName: string }; base: ClientBase } | null) => void;
  onSetBaseToDelete: (base: ClientBase | null) => void; // Nova prop para exclusão de base
  onSetBaseToToggleStatus: (base: ClientBase) => void; // Nova prop para ativar/inativar base
}

export const BaseManagement: React.FC<BaseManagementProps> = ({
  clientBases,
  nextNumberId,
  baseCreatorsMap,
  onGenerateInviteLink,
  generatedInviteLink,
  onSetUserToRemove,
  onSetBaseToDelete, // Nova prop
  onSetBaseToToggleStatus,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newBaseName, setNewBaseName] = useState("");
  const [newBaseLimit, setNewBaseLimit] = useState<string>(""); // Estado para o limite da nova base
  const [isLoading, setIsLoading] = useState(false);
  const [limitInputs, setLimitInputs] = useState<{ [baseId: string]: string }>({});
  const [savingLimitForBase, setSavingLimitForBase] = useState<string | null>(null);

  const handleAddClientBase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBaseName.trim() || !currentUser || nextNumberId === null) {
      toast({ title: "Erro", description: "Nome da base é obrigatório.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const clientBasesRef = ref(db, "clientBases");
    const newClientBaseRef = push(clientBasesRef);

    const authorizedUIDsObject: ClientBase['authorizedUIDs'] = {
      [currentUser.uid]: {
        displayName: currentUser.displayName || "Admin",
        email: currentUser.email || "Não informado",
      },
    };

    let limiteAcessoParaNovaBase: number | null = null;
    if (newBaseLimit.trim() !== "" && newBaseLimit.trim() !== "0") {
      const parsedLimit = parseInt(newBaseLimit, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        toast({
          title: "Valor Inválido para Limite",
          description: "O limite de acesso deve ser um número inteiro positivo (maior que zero), ou 0/vazio para ilimitado.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      limiteAcessoParaNovaBase = parsedLimit;
    }

    const baseData: Omit<ClientBase, "id"> = {
      name: newBaseName,
      numberId: nextNumberId,
      authorizedUIDs: authorizedUIDsObject,
      createdAt: serverTimestamp() as any,
      limite_acesso: limiteAcessoParaNovaBase, // Usar o valor do input
      createdBy: currentUser.uid,
      ativo: true, // Definir base como ativa na criação
      motivo_inativo: null, // Inicialmente sem motivo
    };

    try {
      await set(newClientBaseRef, baseData);
      toast({ title: "Sucesso!", description: `Base "${newBaseName}" criada com ID ${nextNumberId}.` });
      setNewBaseName("");
      setNewBaseLimit(""); // Limpar o campo de limite
    } catch (error) {
      console.error("Erro ao criar base:", error);
      toast({ title: "Erro ao criar base", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitInputChange = (baseId: string, value: string) => {
    setLimitInputs(prev => ({ ...prev, [baseId]: value }));
  };

  const handleSaveAccessLimit = async (baseId: string) => {
    const base = clientBases.find(b => b.id === baseId);
    if (!base) return;

    const newLimitString = limitInputs[baseId] !== undefined 
      ? limitInputs[baseId] 
      : (base.limite_acesso?.toString() ?? "");

    let newLimitValue: number | null = null;

    if (newLimitString.trim() === "" || newLimitString.trim() === "0") {
      newLimitValue = null; // Ilimitado
    } else {
      const parsedLimit = parseInt(newLimitString, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        toast({
          title: "Valor Inválido",
          description: "O limite deve ser um número inteiro positivo (maior que zero), ou 0/vazio para ilimitado.",
          variant: "destructive",
        });
        return;
      }
      newLimitValue = parsedLimit;
    }

    setSavingLimitForBase(baseId);
    try {
      const baseUpdateRef = ref(db, `clientBases/${baseId}`);
      await update(baseUpdateRef, { limite_acesso: newLimitValue });
      toast({
        title: "Sucesso",
        description: `Limite de acesso para a base "${base.name}" atualizado.`,
        variant: "success",
      });
      // Atualiza o estado local do input para refletir o valor salvo e desabilitar o botão "Salvar"
      setLimitInputs(prev => ({ ...prev, [baseId]: newLimitValue === null ? "" : newLimitValue.toString() }));
    } catch (error) {
      console.error("Erro ao salvar limite de acesso:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível atualizar o limite de acesso.",
        variant: "destructive",
      });
    } finally {
      setSavingLimitForBase(null);
    }
  };

  const isLimitChanged = (base: ClientBase): boolean => {
    const inputValue = limitInputs[base.id];
    if (inputValue === undefined) return false; // Input não tocado

    const currentDbLimit = base.limite_acesso ?? null;
    let inputValueAsActual: number | null;

    if (inputValue.trim() === "" || inputValue.trim() === "0") {
      inputValueAsActual = null;
    } else {
      const parsed = parseInt(inputValue, 10);
      // Se inválido, consideramos como "alterado" para que a validação no save ocorra
      if (isNaN(parsed) || parsed <= 0) return true; 
      inputValueAsActual = parsed;
    }
    return currentDbLimit !== inputValueAsActual;
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
          <div>
            <Label htmlFor="newBaseLimit">Limite de Acessos (0 ou vazio para ilimitado)</Label>
            <Input id="newBaseLimit" type="number" min="0" value={newBaseLimit} onChange={(e) => setNewBaseLimit(e.target.value)} placeholder="Ex: 5" />
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
                      <div className="flex flex-wrap items-start sm:items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onGenerateInviteLink(base)} className="w-full sm:w-auto">
                          <Send className="mr-2 h-4 w-4" /> Gerar Convite
                        </Button>
                        <Button 
                          variant={base.ativo ? "outline" : "secondary"} 
                          size="sm" 
                          onClick={() => onSetBaseToToggleStatus(base)} 
                          className="w-full sm:w-auto border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                        >
                          {base.ativo ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />} {base.ativo ? "Inativar" : "Ativar"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onSetBaseToDelete(base)} className="w-full sm:w-auto">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir Base
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Criado por: {baseCreatorsMap[base.createdBy] || base.createdBy} em {new Date(base.createdAt).toLocaleDateString('pt-BR')}</p>
                    
                    {!base.ativo && base.motivo_inativo && (
                      <Alert variant="destructive" className="mt-2 text-xs">
                        <AlertDescription><strong>Motivo da Inativação:</strong> {base.motivo_inativo}</AlertDescription>
                      </Alert>
                    )}
                    {/* Seção de Limite de Acesso */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <Label htmlFor={`limit-${base.id}`} className="text-sm font-medium">Limite de Usuários na Base</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">0 ou vazio para ilimitado. Administradores não contam para este limite.</p>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`limit-${base.id}`}
                          type="number"
                          min="0"
                          value={limitInputs[base.id] ?? base.limite_acesso?.toString() ?? ""}
                          onChange={(e) => handleLimitInputChange(base.id, e.target.value)}
                          placeholder="Ex: 5"
                          className="max-w-[120px] h-9"
                        />
                        <Button size="sm" onClick={() => handleSaveAccessLimit(base.id)} disabled={savingLimitForBase === base.id || !isLimitChanged(base)} className="h-9">
                          <Save className="mr-2 h-4 w-4" /> {savingLimitForBase === base.id ? "Salvando..." : "Salvar Limite"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
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