import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import type { ClientBase } from "@/types/store";
import { push, ref, serverTimestamp, set, update } from "firebase/database";
import {
  Copy,
  Edit,
  Info,
  List,
  Minus,
  Plus,
  PlusCircle,
  Power,
  PowerOff,
  Save,
  Send,
  Trash2,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import React, { FormEvent, useState } from "react";
import { InviteByIdModal } from "./InviteByIdModal";

interface BaseManagementProps {
  clientBases: ClientBase[];
  nextNumberId: number | null;
  baseCreatorsMap: { [uid: string]: string };
  onGenerateInviteLink: (base: ClientBase) => void;
  generatedInviteLink: string | null;
  onSetUserToRemove: (
    user: {
      user: { uid: string; displayName: string };
      base: ClientBase;
    } | null
  ) => void;
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
  const [newBaseName, setNewBaseName] = useState("");
  const [newBaseLimit, setNewBaseLimit] = useState<string>(""); // Estado para o limite da nova base
  const [newBaseCNPJ, setNewBaseCNPJ] = useState("");
  const [newBaseResponsaveis, setNewBaseResponsaveis] = useState([
    {
      nome: "",
      telefone: "",
      funcoes: {
        financeiro: false,
        sistema: false,
      },
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [limitInputs, setLimitInputs] = useState<{ [baseId: string]: string }>(
    {}
  );
  const [savingLimitForBase, setSavingLimitForBase] = useState<string | null>(
    null
  );
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLinksPerBase, setInviteLinksPerBase] = useState<{
    [baseId: string]: string;
  }>({});
  const [lastGeneratedBaseId, setLastGeneratedBaseId] = useState<string | null>(
    null
  );

  // Estados para edição inline das bases
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [editingBaseName, setEditingBaseName] = useState("");
  const [editingBaseCNPJ, setEditingBaseCNPJ] = useState("");
  const [editingBaseResponsaveis, setEditingBaseResponsaveis] = useState<
    Array<{
      nome: string;
      telefone: string;
      funcoes: {
        financeiro: boolean;
        sistema: boolean;
      };
    }>
  >([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Sincronizar o generatedInviteLink com o estado local por base
  React.useEffect(() => {
    if (generatedInviteLink && lastGeneratedBaseId) {
      setInviteLinksPerBase((prev) => ({
        ...prev,
        [lastGeneratedBaseId]: generatedInviteLink,
      }));
    }
  }, [generatedInviteLink, lastGeneratedBaseId]);

  const handleAddClientBase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBaseName.trim() || !currentUser || nextNumberId === null) {
      toast.validationError("Nome da base é obrigatório.");
      return;
    }

    if (!newBaseCNPJ.trim()) {
      toast.validationError("CNPJ da loja principal é obrigatório.");
      return;
    }

    // Validar se pelo menos um responsável tem nome e telefone
    const responsaveisValidos = newBaseResponsaveis.filter(
      (r) => r.nome.trim() !== "" && r.telefone.trim() !== ""
    );

    if (responsaveisValidos.length === 0) {
      toast.validationError(
        "É necessário informar pelo menos um responsável com nome e telefone."
      );
      return;
    }

    setIsLoading(true);

    const clientBasesRef = ref(db, "clientBases");
    const newClientBaseRef = push(clientBasesRef);

    // Admins não precisam estar na lista de usuários autorizados
    // A base será criada sem usuários autorizados inicialmente
    const authorizedUIDsObject: ClientBase["authorizedUIDs"] = {};

    let limiteAcessoParaNovaBase: number | null = null;
    if (newBaseLimit.trim() !== "" && newBaseLimit.trim() !== "0") {
      const parsedLimit = parseInt(newBaseLimit, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        toast.validationError(
          "O limite de acesso deve ser um número inteiro positivo (maior que zero), ou 0/vazio para ilimitado."
        );
        setIsLoading(false);
        return;
      }
      limiteAcessoParaNovaBase = parsedLimit;
    }

    const baseData = {
      name: newBaseName,
      numberId: nextNumberId,
      authorizedUIDs: authorizedUIDsObject,
      createdAt: serverTimestamp(),
      limite_acesso: limiteAcessoParaNovaBase,
      createdBy: currentUser.uid,
      ativo: true,
      motivo_inativo: null,
      cnpj: newBaseCNPJ.trim(),
      responsaveis: responsaveisValidos.map((r) => ({
        nome: r.nome.trim(),
        telefone: r.telefone.trim(),
        isFinanceiro: r.funcoes.financeiro,
        isSistema: r.funcoes.sistema,
      })),
    };

    try {
      await set(newClientBaseRef, baseData);

      toast.createSuccess(
        `Base "${newBaseName}" criada com ID ${nextNumberId}`
      );
      setNewBaseName("");
      setNewBaseLimit("");
      setNewBaseCNPJ("");
      setNewBaseResponsaveis([
        {
          nome: "",
          telefone: "",
          funcoes: {
            financeiro: false,
            sistema: false,
          },
        },
      ]);
    } catch (error) {
      toast.createError(
        `${(error as Error).message} - Verifique as permissões do Firebase.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitInputChange = (baseId: string, value: string) => {
    setLimitInputs((prev) => ({ ...prev, [baseId]: value }));
  };

  const handleSaveAccessLimit = async (baseId: string) => {
    const base = clientBases.find((b) => b.id === baseId);
    if (!base) return;

    const newLimitString =
      limitInputs[baseId] !== undefined
        ? limitInputs[baseId]
        : base.limite_acesso?.toString() ?? "";

    let newLimitValue: number | null = null;

    if (newLimitString.trim() === "" || newLimitString.trim() === "0") {
      newLimitValue = null; // Ilimitado
    } else {
      const parsedLimit = parseInt(newLimitString, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        toast.validationError(
          "O limite deve ser um número inteiro positivo (maior que zero), ou 0/vazio para ilimitado."
        );
        return;
      }
      newLimitValue = parsedLimit;
    }

    setSavingLimitForBase(baseId);
    try {
      const baseUpdateRef = ref(db, `clientBases/${baseId}`);
      await update(baseUpdateRef, { limite_acesso: newLimitValue });
      toast.updateSuccess(`Limite de acesso para a base "${base.name}"`);
      // Atualiza o estado local do input para refletir o valor salvo e desabilitar o botão "Salvar"
      setLimitInputs((prev) => ({
        ...prev,
        [baseId]: newLimitValue === null ? "" : newLimitValue.toString(),
      }));
    } catch (error) {
      toast.updateError("Não foi possível atualizar o limite de acesso.");
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

  const handleGenerateInviteForBase = (base: ClientBase) => {
    setLastGeneratedBaseId(base.id);
    onGenerateInviteLink(base);
  };

  const handleCopyInviteLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.copySuccess("Link");
    } catch (error) {
      toast.error({
        title: "Erro ao copiar",
        description: "Falha ao copiar o link.",
      });
    }
  };

  // Funções para gerenciar responsáveis
  const addResponsavel = () => {
    setNewBaseResponsaveis([
      ...newBaseResponsaveis,
      {
        nome: "",
        telefone: "",
        funcoes: {
          financeiro: false,
          sistema: false,
        },
      },
    ]);
  };

  const removeResponsavel = (index: number) => {
    if (newBaseResponsaveis.length > 1) {
      setNewBaseResponsaveis(newBaseResponsaveis.filter((_, i) => i !== index));
    }
  };

  const updateResponsavel = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = [...newBaseResponsaveis];
    if (field === "nome" || field === "telefone") {
      updated[index][field] = value as string;
    } else {
      updated[index].funcoes = {
        ...updated[index].funcoes,
        [field]: value as boolean,
      };
    }
    setNewBaseResponsaveis(updated);
  };

  // Funções para edição inline de bases
  const handleEditBase = (base: ClientBase) => {
    setEditingBaseId(base.id);
    setEditingBaseName(base.name);
    setEditingBaseCNPJ(base.cnpj || "");
    const responsaveis =
      base.responsaveis?.map((r) => ({
        nome: r.nome,
        telefone: r.telefone,
        funcoes: {
          financeiro: r.isFinanceiro,
          sistema: r.isSistema,
        },
      })) || [];

    // Garantir que sempre há pelo menos um responsável para edição
    if (responsaveis.length === 0) {
      responsaveis.push({
        nome: "",
        telefone: "",
        funcoes: {
          financeiro: false,
          sistema: false,
        },
      });
    }

    setEditingBaseResponsaveis(responsaveis);
  };

  const handleSaveEditBase = async (baseId: string) => {
    if (!editingBaseName.trim()) {
      toast.validationError("Nome da base é obrigatório.");
      return;
    }

    if (!editingBaseCNPJ.trim()) {
      toast.validationError("CNPJ da loja principal é obrigatório.");
      return;
    }

    // Validar se pelo menos um responsável tem nome e telefone
    const responsaveisValidos = editingBaseResponsaveis.filter(
      (r) => r.nome.trim() !== "" && r.telefone.trim() !== ""
    );

    if (responsaveisValidos.length === 0) {
      toast.validationError(
        "É necessário informar pelo menos um responsável com nome e telefone."
      );
      return;
    }

    setSavingEdit(true);
    try {
      const baseUpdateRef = ref(db, `clientBases/${baseId}`);
      await update(baseUpdateRef, {
        name: editingBaseName.trim(),
        cnpj: editingBaseCNPJ.trim(),
        responsaveis: responsaveisValidos.map((r) => ({
          nome: r.nome.trim(),
          telefone: r.telefone.trim(),
          isFinanceiro: r.funcoes.financeiro,
          isSistema: r.funcoes.sistema,
        })),
      });
      toast.updateSuccess(`Base "${editingBaseName}" atualizada com sucesso.`);
      setEditingBaseId(null);
    } catch (error) {
      toast.updateError("Erro ao atualizar a base. Tente novamente.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBaseId(null);
  };

  // Funções para gerenciar responsáveis na edição
  const addEditResponsavel = () => {
    setEditingBaseResponsaveis([
      ...editingBaseResponsaveis,
      {
        nome: "",
        telefone: "",
        funcoes: {
          financeiro: false,
          sistema: false,
        },
      },
    ]);
  };

  const removeEditResponsavel = (index: number) => {
    if (editingBaseResponsaveis.length > 1) {
      setEditingBaseResponsaveis(
        editingBaseResponsaveis.filter((_, i) => i !== index)
      );
    }
  };

  const updateEditResponsavel = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = [...editingBaseResponsaveis];
    if (field === "nome" || field === "telefone") {
      updated[index][field] = value as string;
    } else {
      updated[index].funcoes = {
        ...updated[index].funcoes,
        [field]: value as boolean,
      };
    }
    setEditingBaseResponsaveis(updated);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <List className="h-5 w-5 sm:h-6 sm:w-6" /> Gerenciar Bases de Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        <form
          onSubmit={handleAddClientBase}
          className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-md bg-slate-50 dark:bg-slate-900"
        >
          <h3 className="text-base sm:text-lg font-semibold">
            Criar Nova Base
          </h3>

          {/* Primeira linha: ID e Nome da Base */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="baseNumberId" className="text-sm">
                ID Numérico
              </Label>
              <Input
                id="baseNumberId"
                value={nextNumberId ?? "Carregando..."}
                readOnly
                disabled
                className="bg-gray-100 dark:bg-gray-800 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="baseName" className="text-sm">
                Nome da Base *
              </Label>
              <Input
                id="baseName"
                value={newBaseName}
                onChange={(e) => setNewBaseName(e.target.value)}
                placeholder="Ex: Cliente Alpha"
                required
                className="text-sm"
              />
            </div>
          </div>

          {/* Segunda linha: CNPJ e Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="newBaseCNPJ" className="text-sm">
                CNPJ da Loja Principal *
              </Label>
              <Input
                id="newBaseCNPJ"
                value={newBaseCNPJ}
                onChange={(e) => setNewBaseCNPJ(e.target.value)}
                placeholder="00.000.000/0000-00"
                required
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="newBaseLimit" className="text-sm">
                Limite de Acessos
              </Label>
              <Input
                id="newBaseLimit"
                type="number"
                min="0"
                value={newBaseLimit}
                onChange={(e) => setNewBaseLimit(e.target.value)}
                placeholder="0 = ilimitado"
                className="text-sm"
              />
            </div>
          </div>

          {/* Seção de Responsáveis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Responsáveis *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResponsavel}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {newBaseResponsaveis.map((responsavel, index) => (
              <div
                key={index}
                className="p-3 border rounded-md bg-white dark:bg-slate-800 space-y-3"
              >
                {/* Nome e Telefone do Responsável */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor={`responsavel-nome-${index}`}
                      className="text-sm"
                    >
                      Nome do Responsável *
                    </Label>
                    <Input
                      id={`responsavel-nome-${index}`}
                      value={responsavel.nome}
                      onChange={(e) =>
                        updateResponsavel(index, "nome", e.target.value)
                      }
                      placeholder="Nome completo"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label
                        htmlFor={`responsavel-telefone-${index}`}
                        className="text-sm"
                      >
                        Telefone *
                      </Label>
                      <Input
                        id={`responsavel-telefone-${index}`}
                        value={responsavel.telefone}
                        onChange={(e) =>
                          updateResponsavel(index, "telefone", e.target.value)
                        }
                        placeholder="(00) 00000-0000"
                        className="mt-1"
                        required
                      />
                    </div>
                    {newBaseResponsaveis.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResponsavel(index)}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Funções do Responsável */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Funções do Responsável
                  </Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${index}-financeiro`}
                        checked={responsavel.funcoes.financeiro}
                        onCheckedChange={(checked) =>
                          updateResponsavel(index, "financeiro", checked)
                        }
                      />
                      <Label
                        htmlFor={`${index}-financeiro`}
                        className="text-sm font-normal"
                      >
                        Responsável Financeiro
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${index}-sistema`}
                        checked={responsavel.funcoes.sistema}
                        onCheckedChange={(checked) =>
                          updateResponsavel(index, "sistema", checked)
                        }
                      />
                      <Label
                        htmlFor={`${index}-sistema`}
                        className="text-sm font-normal"
                      >
                        Responsável pelo Sistema
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            disabled={isLoading || nextNumberId === null}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Criando..." : "Criar Base"}
          </Button>
        </form>

        {generatedInviteLink && (
          <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Link de Convite Gerado!</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input
                type="text"
                value={generatedInviteLink}
                readOnly
                className="mt-1 bg-white dark:bg-slate-800 flex-grow"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2 sm:mt-1"
                onClick={() =>
                  navigator.clipboard
                    .writeText(generatedInviteLink)
                    .then(() => toast.copySuccess("Link"))
                    .catch(() =>
                      toast.error({
                        title: "Erro ao copiar",
                        description: "Falha ao copiar.",
                      })
                    )
                }
              >
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bases Existentes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Gerar Convite por ID
            </Button>
          </div>
          {clientBases.length === 0 ? (
            <p>Nenhuma base de cliente cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {clientBases
                .sort((a, b) => (a.numberId || 0) - (b.numberId || 0))
                .map((base, index) => (
                  <li
                    key={base.id}
                    className={`p-4 border rounded-lg flex flex-col justify-between gap-3 bg-slate-100 dark:bg-slate-700 shadow-sm`}
                  >
                    <div>
                      {/* Cabeçalho da base com edição inline */}
                      {editingBaseId === base.id ? (
                        // Modo de edição
                        <div className="space-y-4 mb-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                              Editando Base
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEditBase(base.id)}
                                disabled={savingEdit}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                {savingEdit ? "Salvando..." : "Salvar"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={savingEdit}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
                            </div>
                          </div>

                          {/* Campos de edição */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm font-medium">
                                ID Numérico
                              </Label>
                              <Input
                                value={base.numberId}
                                readOnly
                                disabled
                                className="bg-gray-100 dark:bg-gray-800 text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Não editável
                              </p>
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-sm font-medium">
                                Nome da Base *
                              </Label>
                              <Input
                                value={editingBaseName}
                                onChange={(e) =>
                                  setEditingBaseName(e.target.value)
                                }
                                placeholder="Ex: Cliente Alpha"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">
                              CNPJ da Loja Principal *
                            </Label>
                            <Input
                              value={editingBaseCNPJ}
                              onChange={(e) =>
                                setEditingBaseCNPJ(e.target.value)
                              }
                              placeholder="00.000.000/0000-00"
                              className="text-sm max-w-sm"
                            />
                          </div>

                          {/* Responsáveis na edição */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-medium">
                                Responsáveis *
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addEditResponsavel}
                                className="h-8 px-2"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>

                            {editingBaseResponsaveis.map(
                              (responsavel, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-md bg-white dark:bg-slate-800 space-y-3"
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-sm">
                                        Nome do Responsável *
                                      </Label>
                                      <Input
                                        value={responsavel.nome}
                                        onChange={(e) =>
                                          updateEditResponsavel(
                                            index,
                                            "nome",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Nome completo"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="flex items-end gap-2">
                                      <div className="flex-1">
                                        <Label className="text-sm">
                                          Telefone *
                                        </Label>
                                        <Input
                                          value={responsavel.telefone}
                                          onChange={(e) =>
                                            updateEditResponsavel(
                                              index,
                                              "telefone",
                                              e.target.value
                                            )
                                          }
                                          placeholder="(00) 00000-0000"
                                          className="mt-1"
                                        />
                                      </div>
                                      {editingBaseResponsaveis.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeEditResponsavel(index)
                                          }
                                          className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">
                                      Funções do Responsável
                                    </Label>
                                    <div className="flex gap-4">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            responsavel.funcoes.financeiro
                                          }
                                          onCheckedChange={(checked) =>
                                            updateEditResponsavel(
                                              index,
                                              "financeiro",
                                              checked
                                            )
                                          }
                                        />
                                        <Label className="text-sm font-normal">
                                          Responsável Financeiro
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={responsavel.funcoes.sistema}
                                          onCheckedChange={(checked) =>
                                            updateEditResponsavel(
                                              index,
                                              "sistema",
                                              checked
                                            )
                                          }
                                        />
                                        <Label className="text-sm font-normal">
                                          Responsável pelo Sistema
                                        </Label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        // Modo de visualização
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-primary">
                              {base.name}
                            </span>
                            <Badge variant="secondary">
                              ID: {base.numberId}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-start sm:items-center gap-2">
                            {/* Todos os botões lado a lado */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBase(base)}
                              className="w-full sm:w-auto"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Base
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateInviteForBase(base)}
                              className="w-full sm:w-auto"
                            >
                              <Send className="mr-2 h-4 w-4" /> Gerar Convite
                            </Button>
                            <Button
                              variant={base.ativo ? "outline" : "secondary"}
                              size="sm"
                              onClick={() => onSetBaseToToggleStatus(base)}
                              className="w-full sm:w-auto border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                            >
                              {base.ativo ? (
                                <PowerOff className="mr-2 h-4 w-4" />
                              ) : (
                                <Power className="mr-2 h-4 w-4" />
                              )}{" "}
                              {base.ativo ? "Inativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onSetBaseToDelete(base)}
                              className="w-full sm:w-auto"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir Base
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Informações da base (sempre visíveis) */}
                      {editingBaseId !== base.id && (
                        <>
                          {/* Exibir CNPJ */}
                          <div className="mb-3 space-y-3">
                            {base.cnpj && (
                              <div className="text-sm">
                                <span className="font-medium">CNPJ:</span>{" "}
                                <span className="text-gray-700 dark:text-gray-300">
                                  {base.cnpj}
                                </span>
                              </div>
                            )}

                            {/* Tabela de Responsáveis */}
                            {base.responsaveis &&
                              base.responsaveis.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">
                                    Responsáveis:
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                                      <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-medium">
                                            Nome
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-medium">
                                            Telefone
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-center font-medium">
                                            Resp. Financeiro
                                          </th>
                                          <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-center font-medium">
                                            Resp. Sistema
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {base.responsaveis.map((resp, idx) => (
                                          <tr
                                            key={idx}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                          >
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-medium">
                                              {resp.nome}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-600 dark:text-gray-400">
                                              {resp.telefone}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-center">
                                              {resp.isFinanceiro ? (
                                                <Badge
                                                  variant="outline"
                                                  className="bg-green-50 text-green-700 border-green-200"
                                                >
                                                  Sim
                                                </Badge>
                                              ) : (
                                                <span className="text-gray-400">
                                                  Não
                                                </span>
                                              )}
                                            </td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-center">
                                              {resp.isSistema ? (
                                                <Badge
                                                  variant="outline"
                                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                                >
                                                  Sim
                                                </Badge>
                                              ) : (
                                                <span className="text-gray-400">
                                                  Não
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Link de convite, se existir */}
                          {inviteLinksPerBase[base.id] && (
                            <div className="mb-3">
                              <Label className="text-sm font-medium">
                                Link de Convite Gerado:
                              </Label>
                              <Input
                                value={inviteLinksPerBase[base.id]}
                                readOnly
                                onClick={(e) => {
                                  (e.target as HTMLInputElement).select();
                                  handleCopyInviteLink(
                                    inviteLinksPerBase[base.id]
                                  );
                                }}
                                className="mt-1 cursor-pointer bg-green-50 border-green-200 text-green-800"
                                title="Clique para copiar o link"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Informações de criação e status (sempre visíveis) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Criado por:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {baseCreatorsMap[base.createdBy] || base.createdBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Data:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {new Date(base.createdAt).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {!base.ativo && base.motivo_inativo && (
                        <Alert variant="destructive" className="mt-2 text-xs">
                          <AlertDescription>
                            <strong>Motivo da Inativação:</strong>{" "}
                            {base.motivo_inativo}
                          </AlertDescription>
                        </Alert>
                      )}
                      {/* Seção de Limite de Acesso */}
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                        <Label
                          htmlFor={`limit-${base.id}`}
                          className="text-sm font-medium"
                        >
                          Limite de Usuários na Base
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          0 ou vazio para ilimitado. Administradores não contam
                          para este limite.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`limit-${base.id}`}
                            type="number"
                            min="0"
                            value={
                              limitInputs[base.id] ??
                              base.limite_acesso?.toString() ??
                              ""
                            }
                            onChange={(e) =>
                              handleLimitInputChange(base.id, e.target.value)
                            }
                            placeholder="Ex: 5"
                            className="max-w-[120px] h-9"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveAccessLimit(base.id)}
                            disabled={
                              savingLimitForBase === base.id ||
                              !isLimitChanged(base)
                            }
                            className="h-9"
                          >
                            <Save className="mr-2 h-4 w-4" />{" "}
                            {savingLimitForBase === base.id
                              ? "Salvando..."
                              : "Salvar Limite"}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium">
                          Usuários Autorizados:
                        </h4>
                        {base.authorizedUIDs &&
                        Object.keys(base.authorizedUIDs).length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {Object.entries(base.authorizedUIDs).map(
                              ([uid, authData]) => (
                                <li
                                  key={uid}
                                  className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 bg-slate-200 dark:bg-slate-700/50 p-2 rounded-md"
                                >
                                  <span>
                                    <span className="font-semibold">Nome:</span>{" "}
                                    {authData.displayName ||
                                      "Nome Desconhecido"}{" "}
                                    |{" "}
                                    <span className="font-semibold">
                                      E-mail:
                                    </span>{" "}
                                    ({authData.email || "Email Desconhecido"})
                                  </span>
                                  {Object.keys(base.authorizedUIDs).length >
                                    1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        onSetUserToRemove({
                                          user: {
                                            uid,
                                            displayName:
                                              authData.displayName ||
                                              `Usuário (UID: ${uid.substring(
                                                0,
                                                6
                                              )}...)`,
                                          },
                                          base,
                                        })
                                      }
                                    >
                                      <UserX className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            Nenhum usuário autorizado nesta base.
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </CardContent>

      {/* Modal para gerar convite por ID */}
      <InviteByIdModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        clientBases={clientBases}
        onGenerateInviteLink={onGenerateInviteLink}
        generatedInviteLink={generatedInviteLink}
      />
    </Card>
  );
};
