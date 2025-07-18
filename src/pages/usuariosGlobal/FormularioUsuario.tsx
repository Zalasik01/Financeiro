import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInvites } from "@/hooks/useInvites";
import type { ClientBase } from "@/types/store";
// importação do Firebase removida
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  Plus,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface UserFormData {
  displayName: string;
  email: string;
  isAdmin: boolean;
  clientBaseId: number | null;
  authDisabled: boolean;
  associatedBases: string[]; // IDs das bases
}

export const FormularioUsuario: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createInvite } = useInvites();
  const { toast } = useToast();
  const isEdicao = Boolean(uid);

  const [formData, setFormData] = useState<UserFormData>({
    displayName: "",
    email: "",
    isAdmin: false,
    clientBaseId: null,
    authDisabled: false,
    associatedBases: [],
  });

  const [clientBases, setClientBases] = useState<ClientBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  const [baseParaVincular, setBaseParaVincular] = useState("");
  const [buscaBase, setBuscaBase] = useState("");
  const [modalConviteAberto, setModalConviteAberto] = useState(false);
  const [linkConvite, setLinkConvite] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [mensagemCopiada, setMensagemCopiada] = useState(false);

  // Carregamento das bases
  useEffect(() => {
    const clientBasesRef = ref(db, "clientBases");
    const unsubscribe = onValue(clientBasesRef, (snapshot) => {
      const data = snapshot.val();
      const basesArray: ClientBase[] = data
        ? Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((base) => base.ativo) // Apenas bases ativas
        : [];
      setClientBases(basesArray);
    });
    return () => unsubscribe();
  }, []);

  // Carregar dados para edição
  useEffect(() => {
    if (isEdicao && uid) {
      setIsLoading(true);
      const userRef = ref(db, `users/${uid}`);

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setFormData({
              displayName:
                userData.profile?.displayName || userData.displayName || "",
              email: userData.profile?.email || userData.email || "",
              isAdmin: userData.profile?.isAdmin || false,
              clientBaseId: userData.profile?.clientBaseId || null,
              authDisabled: userData.profile?.authDisabled || false,
              associatedBases: [], // Será carregado das bases
            });

            // Carregar bases associadas
            if (clientBases.length > 0) {
              const associatedBaseIds: string[] = [];
              clientBases.forEach((base) => {
                if (base.authorizedUIDs && base.authorizedUIDs[uid]) {
                  associatedBaseIds.push(base.id);
                }
              });
              setFormData((prev) => ({
                ...prev,
                associatedBases: associatedBaseIds,
              }));
            }
          } else {
            toast.error({
              title: "Erro",
              description: "Usuário não encontrado.",
            });
            navigate("/admin/gerenciar-usuarios-global");
          }
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Erro ao carregar",
            description: `Erro ao carregar dados do usuário: ${error.message}`,
          });
          navigate("/admin/gerenciar-usuarios-global");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEdicao, uid, navigate, clientBases, toast]);

  const handleInputChange = <K extends keyof UserFormData>(
    field: K,
    value: UserFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBaseToggle = (baseId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      associatedBases: checked
        ? [...prev.associatedBases, baseId]
        : prev.associatedBases.filter((id) => id !== baseId),
    }));
  };

  const handleVincularBase = () => {
    if (!baseParaVincular) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma base para vincular.",
      });
      return;
    }

    const baseJaVinculada = formData.associatedBases.includes(baseParaVincular);
    if (baseJaVinculada) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Esta base já está vinculada ao usuário.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      associatedBases: [...prev.associatedBases, baseParaVincular],
    }));

    setBaseParaVincular("");
    setModalVincularAberto(false);

    toast({
      title: "Sucesso",
      description: "Base vinculada com sucesso!",
    });
  };

  const handleDesvincularBase = (baseId: string) => {
    setFormData((prev) => ({
      ...prev,
      associatedBases: prev.associatedBases.filter((id) => id !== baseId),
    }));

    toast.success({
      title: "Sucesso",
      description: "Base desvinculada com sucesso!",
    });
  };

  const gerarLinkConvite = async (userId: string) => {
    if (!currentUser) return null;

    try {
      const inviteLink = await createInvite({
        email: formData.email,
        nomeexibicao: formData.displayName,
        admin: formData.isAdmin,
        idusuario: userId,
        idbasepadrao: formData.clientBaseId || null
      });

      return inviteLink;
    } catch (error) {
      console.error('Erro ao criar convite:', error);
      toast.error({
        title: "Erro",
        description: "Não foi possível gerar o convite.",
      });
      return null;
    }
  };

  const copiarLinkConvite = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
      toast.success({
        title: "Link copiado!",
        description:
          "O link de convite foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast.error({
        title: "Erro",
        description: "Não foi possível copiar o link.",
      });
    }
  };

  const copiarMensagemCompleta = async () => {
    const mensagem = `🎉 Parabéns! Sua conta foi criada com sucesso!

Olá ${formData.displayName},

Sua conta no sistema financeiro foi criada e está pronta para uso. Para acessar, siga os passos abaixo:

1. Abra o link abaixo em seu navegador:
${linkConvite}

2. Durante o primeiro acesso, você será solicitado a criar uma senha segura
3. Após definir sua senha, você terá acesso completo ao sistema

Se tiver alguma dúvida, entre em contato com o administrador.

Bem-vindo ao sistema! 🚀`;

    try {
      await navigator.clipboard.writeText(mensagem);
      setMensagemCopiada(true);
      setTimeout(() => setMensagemCopiada(false), 2000);
      toast.success({
        title: "Mensagem copiada!",
        description:
          "A mensagem completa foi copiada para a área de transferência.",
      });
    } catch (error) {
      toast.error({
        title: "Erro",
        description: "Não foi possível copiar a mensagem.",
      });
    }
  };

  const gerarNovoConvite = async () => {
    if (!uid || !isEdicao) return;

    const linkGerado = await gerarLinkConvite(uid);
    if (linkGerado) {
      setLinkConvite(linkGerado);
      setModalConviteAberto(true);
      toast.success({
        title: "Novo convite gerado!",
        description: "Um novo link de convite foi criado para este usuário.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.displayName.trim() || !formData.email.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome e email são obrigatórios.",
      });
      return;
    }

    // Para criação de usuário, exigir pelo menos uma base associada
    if (!isEdicao && formData.associatedBases.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O usuário deve estar associado a pelo menos uma base.",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isEdicao && uid) {
        // Atualizar usuário existente
        const userRef = ref(db, `users/${uid}/profile`);
        await update(userRef, {
          displayName: formData.displayName,
          email: formData.email,
          isAdmin: formData.isAdmin,
          clientBaseId: formData.clientBaseId,
          authDisabled: formData.authDisabled,
          updatedAt: Date.now(),
          updatedBy: currentUser?.uid,
        });

        // Atualizar associações com bases
        for (const base of clientBases) {
          const baseRef = ref(
            db,
            `clientBases/${base.id}/authorizedUIDs/${uid}`
          );
          if (formData.associatedBases.includes(base.id)) {
            await set(baseRef, {
              displayName: formData.displayName,
              email: formData.email,
            });
          } else {
            await set(baseRef, null); // Remove a associação
          }
        }

        toast.success({
          title: "Sucesso",
          description: `Usuário "${formData.displayName}" atualizado com sucesso!`,
        });
      } else {
        // Criar novo usuário
        const newUserId = `user_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Criar perfil do usuário
        const userRef = ref(db, `users/${newUserId}/profile`);
        await set(userRef, {
          displayName: formData.displayName,
          email: formData.email,
          isAdmin: formData.isAdmin,
          clientBaseId: null, // Não definir base padrão na criação
          authDisabled: false, // Usuário ativo por padrão
          createdAt: Date.now(),
          createdBy: currentUser?.uid,
          isTemporaryUser: true, // Marca como usuário temporário até fazer login real
          needsPasswordSetup: true, // Precisa definir senha
        });

        // Criar dados básicos do usuário
        const userDataRef = ref(db, `users/${newUserId}`);
        await update(userDataRef, {
          displayName: formData.displayName,
          email: formData.email,
          createdAt: Date.now(),
        });

        // Vincular às bases associadas
        for (const baseId of formData.associatedBases) {
          const baseRef = ref(
            db,
            `clientBases/${baseId}/authorizedUIDs/${newUserId}`
          );
          await set(baseRef, {
            displayName: formData.displayName,
            email: formData.email,
          });
        }

        // Gerar link de convite
        const linkGerado = await gerarLinkConvite(newUserId);
        if (linkGerado) {
          setLinkConvite(linkGerado);
          setModalConviteAberto(true);
        }

        toast.success({
          title: "Sucesso",
          description: `Usuário "${formData.displayName}" criado com sucesso!`,
        });

        // Não redirecionar imediatamente, deixar o modal aberto
        return;
      }

      navigate("/admin/gerenciar-usuarios-global");
    } catch (error) {
      toast.error({
        title: "Erro ao salvar",
        description: `Erro ao salvar usuário: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto">
      <Card className="bg-[#F4F4F4]">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/gerenciar-usuarios-global")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" />
              {isEdicao
                ? `Editar Usuário - ${formData.displayName}`
                : "Novo Usuário"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Nome Completo *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    handleInputChange("displayName", e.target.value)
                  }
                  placeholder="Ex: João Silva"
                  className="border-gray-300 hover:border-black focus:border-black"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Ex: joao@empresa.com"
                  className="border-gray-300 hover:border-black focus:border-black"
                  required
                />
              </div>
            </div>

            {/* Configurações de Acesso */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Acesso
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isAdmin">Administrador do Sistema</Label>
                  <Switch
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) =>
                      handleInputChange("isAdmin", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="authDisabled">Conta Desabilitada</Label>
                  <Switch
                    id="authDisabled"
                    checked={formData.authDisabled}
                    onCheckedChange={(checked) =>
                      handleInputChange("authDisabled", checked)
                    }
                  />
                </div>
              </div>

              {/* Base Padrão - apenas para edição */}
              {isEdicao && (
                <div>
                  <Label htmlFor="clientBaseId">Base Padrão</Label>
                  <Select
                    value={formData.clientBaseId?.toString() || "nenhuma"}
                    onValueChange={(value) =>
                      handleInputChange(
                        "clientBaseId",
                        value === "nenhuma" ? null : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a base padrão (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">
                        Nenhuma base padrão
                      </SelectItem>
                      {clientBases.map((base) => (
                        <SelectItem
                          key={base.id}
                          value={base.numberId?.toString() || "0"}
                        >
                          #{base.numberId} - {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Bases Associadas */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Bases Associadas
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Botão para gerar convite novamente - apenas para edição */}
                    {isEdicao && formData.associatedBases.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          gerarNovoConvite();
                        }}
                        className="text-purple-600 border-purple-300 hover:bg-purple-50"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Gerar Convite
                      </Button>
                    )}
                    <Dialog
                      open={modalVincularAberto}
                      onOpenChange={setModalVincularAberto}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Vincular Base
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Vincular Base ao Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="buscaBase">
                              Buscar Base (ID ou Nome)
                            </Label>
                            <Input
                              id="buscaBase"
                              placeholder="Digite o ID ou nome da base..."
                              value={buscaBase}
                              onChange={(e) => setBuscaBase(e.target.value)}
                              className="border-gray-300 hover:border-black focus:border-black"
                            />
                          </div>
                          <div>
                            <Label htmlFor="baseSelect">Selecione a Base</Label>
                            <Select
                              value={baseParaVincular}
                              onValueChange={setBaseParaVincular}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma base..." />
                              </SelectTrigger>
                              <SelectContent>
                                {clientBases
                                  .filter(
                                    (base) =>
                                      !formData.associatedBases.includes(
                                        base.id
                                      )
                                  )
                                  .filter((base) => {
                                    if (!buscaBase.trim()) return true;
                                    const busca = buscaBase.toLowerCase();
                                    return (
                                      base.name.toLowerCase().includes(busca) ||
                                      base.numberId?.toString().includes(busca)
                                    );
                                  })
                                  .map((base) => (
                                    <SelectItem key={base.id} value={base.id}>
                                      #{base.numberId} - {base.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setModalVincularAberto(false);
                                setBuscaBase("");
                                setBaseParaVincular("");
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleVincularBase}>
                              Vincular
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {formData.associatedBases.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 border-b pb-2">
                      <div className="col-span-2">ID</div>
                      <div className="col-span-8">Nome da Base</div>
                      <div className="col-span-2 text-center">Ações</div>
                    </div>
                    {formData.associatedBases.map((baseId) => {
                      const base = clientBases.find((b) => b.id === baseId);
                      if (!base) return null;

                      return (
                        <div
                          key={baseId}
                          className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100"
                        >
                          <div className="col-span-2 text-sm font-medium">
                            #{base.numberId}
                          </div>
                          <div className="col-span-8 text-sm">
                            {base.name}
                            {formData.clientBaseId === base.numberId && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                Padrão
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesvincularBase(baseId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma base vinculada. Use o botão "Vincular Base" para
                    adicionar.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Modal de Link de Convite */}
            <Dialog
              open={modalConviteAberto}
              onOpenChange={setModalConviteAberto}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Usuário Criado com Sucesso!
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-2">
                      O usuário <strong>{formData.displayName}</strong> foi
                      criado com sucesso. Envie o link abaixo para que ele possa
                      ativar sua conta e definir uma senha.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="linkConvite">Link de Ativação</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="linkConvite"
                        value={linkConvite}
                        readOnly
                        className="font-mono text-sm bg-gray-50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copiarLinkConvite}
                        className="shrink-0"
                      >
                        {linkCopiado ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Instruções:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • Envie este link para o usuário por email ou outro meio
                        seguro
                      </li>
                      <li>
                        • O usuário deve acessar o link para ativar sua conta
                      </li>
                      <li>• Durante a ativação, ele irá definir sua senha</li>
                      <li>• O link é válido apenas para uma ativação</li>
                    </ul>
                  </div>

                  {/* Mensagem personalizada para copiar */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-900">
                        Mensagem para o Usuário
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copiarMensagemCompleta}
                        className="shrink-0"
                      >
                        {mensagemCopiada ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ml-1">Copiar Mensagem</span>
                      </Button>
                    </div>
                    <div className="text-sm text-purple-800 bg-white/50 rounded p-3 font-mono whitespace-pre-line">
                      {`🎉 Parabéns! Sua conta foi criada com sucesso!

Olá ${formData.displayName},

Sua conta no sistema financeiro foi criada e está pronta para uso. Para acessar, siga os passos abaixo:

1. Abra o link abaixo em seu navegador:
${linkConvite}

2. Durante o primeiro acesso, você será solicitado a criar uma senha segura
3. Após definir sua senha, você terá acesso completo ao sistema

Se tiver alguma dúvida, entre em contato com o administrador.

Bem-vindo ao sistema! 🚀`}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setModalConviteAberto(false);
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/gerenciar-usuarios-global")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEdicao ? "Atualizar" : "Criar"} Usuário
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormularioUsuario;
