import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Corrigido: AlertDialogDescription já estava importado
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button"; // Importar buttonVariants
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { ClientBase } from "@/types/store";
import { httpsCallable } from "firebase/functions"; // Importar httpsCallable
import {
  Building2,
  Edit3,
  KeyRound,
  Link2,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  UserX,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  clientBaseId?: number | null;
  authDisabled?: boolean; // Novo campo para status de autenticação
}

interface UserWithBaseInfo extends UserProfile {
  associatedBases: {
    id: string;
    name: string;
    numberId: number;
    role: "authorized" | "default";
  }[];
}

const GerenciarUsuariosGlobalPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allClientBases, setAllClientBases] = useState<ClientBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [userToLink, setUserToLink] = useState<UserWithBaseInfo | null>(null);
  const [baseNumberIdToLink, setBaseNumberIdToLink] = useState<string>("");
  const [userToDelete, setUserToDelete] = useState<UserWithBaseInfo | null>(
    null
  );
  const [userToToggleAdmin, setUserToToggleAdmin] =
    useState<UserWithBaseInfo | null>(null);
  const [userToSetDefaultBase, setUserToSetDefaultBase] =
    useState<UserWithBaseInfo | null>(null);
  const [defaultBaseNumberIdInput, setDefaultBaseNumberIdInput] =
    useState<string>("");
  const [unlinkInfo, setUnlinkInfo] = useState<{
    user: UserWithBaseInfo;
    base: UserWithBaseInfo["associatedBases"][0];
  } | null>(null);

  const fetchData = async () => {
    // Função fetchData simplificada
    setLoading(true);
    setError(null);
    const usersRef = ref(db, "users");
    const clientBasesRef = ref(db, "clientBases");

    try {
      const usersSnapshot = await get(usersRef);
      const basesSnapshot = await get(clientBasesRef);

      const usersData = usersSnapshot.val();
      const basesData = basesSnapshot.val();

      const loadedUsers: UserProfile[] = usersData
        ? Object.keys(usersData).map((uid) => ({
            uid,
            ...usersData[uid].profile,
          }))
        : [];
      setAllUsers(loadedUsers);

      const loadedBases: ClientBase[] = basesData
        ? Object.keys(basesData).map((id) => ({
            id,
            ...basesData[id],
          }))
        : [];
      setAllClientBases(loadedBases);
    } catch (err) {
      console.error("Erro ao buscar dados globais de usuários e bases:", err);
      setError("Falha ao carregar dados. Tente novamente mais tarde.");
      setAllUsers([]); // Limpar em caso de erro
      setAllClientBases([]); // Limpar em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const usersWithBases = useMemo(() => {
    return allUsers.map((user) => {
      const associatedBases: UserWithBaseInfo["associatedBases"] = [];

      allClientBases.forEach((base) => {
        // Verifica se é a base padrão do usuário
        if (user.clientBaseId && user.clientBaseId === base.numberId) {
          if (!associatedBases.find((b) => b.id === base.id)) {
            // Evitar duplicidade se também for autorizado
            associatedBases.push({
              id: base.id,
              name: base.name,
              numberId: base.numberId,
              role: "default",
            });
          }
        }
        // Verifica se o usuário está nos authorizedUIDs da base
        if (base.authorizedUIDs && base.authorizedUIDs[user.uid]) {
          if (!associatedBases.find((b) => b.id === base.id)) {
            // Evitar duplicidade
            associatedBases.push({
              id: base.id,
              name: base.name,
              numberId: base.numberId,
              role: "authorized",
            });
          }
        }
      });
      return { ...user, associatedBases };
    });
  }, [allUsers, allClientBases]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return usersWithBases;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return usersWithBases.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(lowerSearchTerm) ||
        user.email?.toLowerCase().includes(lowerSearchTerm) ||
        user.uid.toLowerCase().includes(lowerSearchTerm) ||
        user.associatedBases.some(
          (base) =>
            base.name.toLowerCase().includes(lowerSearchTerm) ||
            base.numberId.toString().includes(lowerSearchTerm)
        )
    );
  }, [usersWithBases, searchTerm]);

  const handleOpenLinkModal = (user: UserWithBaseInfo) => {
    setUserToLink(user);
    setBaseNumberIdToLink("");
  };

  const handleConfirmLinkToBase = async () => {
    if (!userToLink || !baseNumberIdToLink.trim()) {
      toast({
        title: "Erro",
        description: "Usuário ou ID da base inválido.",
        variant: "destructive",
      });
      return;
    }
    const targetBaseNumberId = parseInt(baseNumberIdToLink, 10);
    if (isNaN(targetBaseNumberId)) {
      toast({
        title: "Erro",
        description: "ID da base deve ser um número.",
        variant: "destructive",
      });
      return;
    }

    const targetBase = allClientBases.find(
      (b) => b.numberId === targetBaseNumberId
    );

    if (!targetBase) {
      toast({
        title: "Erro",
        description: `Nenhuma base encontrada com o ID numérico: ${targetBaseNumberId}.`,
        variant: "destructive",
      });
      return;
    }

    if (
      targetBase.authorizedUIDs &&
      targetBase.authorizedUIDs[userToLink.uid]
    ) {
      toast({
        title: "Informação",
        description: `${
          userToLink.displayName || "Usuário"
        } já está vinculado à base ${targetBase.name}.`,
        variant: "default",
      });
      setUserToLink(null);
      return;
    }

    try {
      const baseAuthUserRef = ref(
        db,
        `clientBases/${targetBase.id}/authorizedUIDs/${userToLink.uid}`
      );
      await set(baseAuthUserRef, {
        displayName: userToLink.displayName || "Nome não informado",
        email: userToLink.email || "Email não informado",
      });

      // Atualizar localmente para refletir a mudança imediatamente (opcional, mas bom para UX)
      setAllClientBases((prevBases) =>
        prevBases.map((b) => {
          if (b.id === targetBase.id) {
            return {
              ...b,
              authorizedUIDs: {
                ...b.authorizedUIDs,
                [userToLink.uid]: {
                  displayName: userToLink.displayName || "Nome não informado",
                  email: userToLink.email || "Email não informado",
                },
              },
            };
          }
          return b;
        })
      );

      toast({
        title: "Sucesso",
        description: `${userToLink.displayName || "Usuário"} vinculado à base ${
          targetBase.name
        } (ID: ${targetBase.numberId}).`,
        variant: "success",
      });
    } catch (err) {
      console.error("Erro ao vincular usuário à base:", err);
      toast({
        title: "Erro",
        description: "Não foi possível vincular o usuário à base.",
        variant: "destructive",
      });
    } finally {
      setUserToLink(null);
    }
  };

  const handleToggleAdminStatus = async () => {
    if (!userToToggleAdmin) return;

    const newAdminStatus = !userToToggleAdmin.isAdmin;
    const actionText = newAdminStatus ? "promover a" : "remover de";

    try {
      const toggleAdminFunction = httpsCallable(
        firebaseFunctions,
        "toggleUserAdminStatus"
      );
      const result = await toggleAdminFunction({
        targetUid: userToToggleAdmin.uid,
        isAdmin: newAdminStatus,
      });
      const resultData = result.data as { success: boolean; message: string };

      if (resultData.success) {
        toast({
          title: "Sucesso!",
          description: resultData.message,
          variant: "success",
        });
        setAllUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uid === userToToggleAdmin.uid
              ? { ...u, isAdmin: newAdminStatus }
              : u
          )
        );
      } else {
        toast({
          title: `Erro ao ${actionText} admin`,
          description: resultData.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as { message?: string };
      console.error(
        `Erro ao chamar Cloud Function toggleUserAdminStatus:`,
        error.message || error
      );
      toast({
        title: "Erro na Operação",
        description:
          error.message || `Não foi possível ${actionText} o status de admin.`,
        variant: "destructive",
      });
    } finally {
      setUserToToggleAdmin(null);
    }
  };

  const handleSetDefaultBase = async () => {
    if (!userToSetDefaultBase || !defaultBaseNumberIdInput.trim()) {
      toast({
        title: "Erro",
        description: "ID da base padrão é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    const targetBaseNumberId = parseInt(defaultBaseNumberIdInput, 10);
    if (isNaN(targetBaseNumberId)) {
      toast({
        title: "Erro",
        description: "ID da base deve ser um número.",
        variant: "destructive",
      });
      return;
    }

    const baseExists = allClientBases.some(
      (b) => b.numberId === targetBaseNumberId
    );
    if (!baseExists) {
      toast({
        title: "Erro",
        description: `Nenhuma base encontrada com o ID numérico: ${targetBaseNumberId}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const setDefaultBaseFunction = httpsCallable(
        firebaseFunctions,
        "setUserDefaultClientBase"
      );
      const result = await setDefaultBaseFunction({
        targetUid: userToSetDefaultBase.uid,
        baseNumberId: targetBaseNumberId,
      });
      const resultData = result.data as { success: boolean; message: string };

      if (resultData.success) {
        toast({
          title: "Sucesso!",
          description: resultData.message,
          variant: "success",
        });
        setAllUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uid === userToSetDefaultBase.uid
              ? { ...u, clientBaseId: targetBaseNumberId }
              : u
          )
        );
      } else {
        toast({
          title: "Erro ao definir base padrão",
          description: resultData.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as { message?: string };
      console.error(
        `Erro ao chamar Cloud Function setUserDefaultClientBase:`,
        error.message || error
      );
      toast({
        title: "Erro na Operação",
        description: error.message || "Não foi possível definir a base padrão.",
        variant: "destructive",
      });
    } finally {
      setUserToSetDefaultBase(null);
      setDefaultBaseNumberIdInput("");
    }
  };

  const handleUnlinkFromBase = async () => {
    if (!unlinkInfo) return;
    const { user, base } = unlinkInfo;

    // Não permitir desvincular da base padrão diretamente por este método.
    // O usuário teria que primeiro alterar a base padrão.
    if (user.clientBaseId === base.numberId && base.role === "default") {
      toast({
        title: "Ação não permitida",
        description:
          "Não é possível desvincular da base padrão. Altere a base padrão primeiro.",
        variant: "destructive",
      });
      setUnlinkInfo(null);
      return;
    }

    try {
      const unlinkFunction = httpsCallable(
        firebaseFunctions,
        "unlinkUserFromClientBase"
      );
      const result = await unlinkFunction({
        targetUid: user.uid,
        clientBaseId: base.id,
      });
      const resultData = result.data as { success: boolean; message: string };

      if (resultData.success) {
        toast({
          title: "Sucesso!",
          description: resultData.message,
          variant: "success",
        });
        // Atualizar localmente
        setAllClientBases((prevBases) =>
          prevBases.map((b) => {
            if (b.id === base.id && b.authorizedUIDs) {
              const { [user.uid]: _, ...remainingAuthUIDs } = b.authorizedUIDs;
              return { ...b, authorizedUIDs: remainingAuthUIDs };
            }
            return b;
          })
        );
      } else {
        toast({
          title: "Erro ao desvincular",
          description: resultData.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as { message?: string };
      console.error(
        `Erro ao chamar Cloud Function unlinkUserFromClientBase:`,
        error.message || error
      );
      toast({
        title: "Erro na Operação",
        description:
          error.message ||
          `Não foi possível desvincular o usuário da base ${base.name}.`,
        variant: "destructive",
      });
    } finally {
      setUnlinkInfo(null);
    }
  };

  // Placeholder functions for other actions
  const handleEditUser = (user: UserWithBaseInfo) =>
    toast({
      title: "Ação: Editar Usuário",
      description: `TODO: Implementar edição para ${user.displayName}.`,
      duration: 5000,
    });

  const handleToggleUserStatus = async (user: UserWithBaseInfo) => {
    const newDisabledStatus = !(user.authDisabled === true); // Se for undefined ou false, se tornará true (desabilitado)
    const actionText = newDisabledStatus ? "desativar" : "ativar";

    try {
      const toggleUserAuthStatusFunction = httpsCallable(
        firebaseFunctions,
        "toggleUserAuthStatus"
      );
      const result = await toggleUserAuthStatusFunction({
        targetUid: user.uid,
        disable: newDisabledStatus,
      });

      const resultData = result.data as { success: boolean; message: string };

      if (resultData.success) {
        toast({
          title: "Sucesso!",
          description: resultData.message,
          variant: "success",
        });
        // Atualizar o estado local do usuário
        setAllUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uid === user.uid ? { ...u, authDisabled: newDisabledStatus } : u
          )
        );
      } else {
        toast({
          title: `Erro ao ${actionText} usuário`,
          description: resultData.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as { message?: string };
      console.error(
        `Erro ao chamar Cloud Function toggleUserAuthStatus para ${actionText} usuário:`,
        error.message || error
      );
      toast({
        title: "Erro na Operação",
        description:
          error.message || `Não foi possível ${actionText} o usuário.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (user: UserWithBaseInfo) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const deleteUserAccountFunction = httpsCallable(
        firebaseFunctions,
        "deleteUserAccount"
      );
      const result = await deleteUserAccountFunction({
        targetUid: userToDelete.uid,
      });
      const resultData = result.data as { success: boolean; message: string };

      if (resultData.success) {
        toast({
          title: "Sucesso!",
          description: resultData.message,
          variant: "success",
        });
        setAllUsers((prevUsers) =>
          prevUsers.filter((u) => u.uid !== userToDelete.uid)
        );
        // A remoção do authorizedUIDs na Cloud Function deve ser refletida
        // se você recarregar os dados das bases ou tiver um listener para elas.
        // Para uma atualização imediata da UI das bases associadas, você pode precisar
        // atualizar 'allClientBases' também, removendo o UID de 'authorizedUIDs'.
      } else {
        toast({
          title: "Erro ao excluir usuário",
          description: resultData.message || "Ocorreu um erro.",
          variant: "destructive",
        });
      }
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as { message?: string };
      console.error(
        "Erro ao chamar Cloud Function deleteUserAccount:",
        error.message || error
      );
      toast({
        title: "Erro na Operação",
        description:
          error.message ||
          `Não foi possível excluir o usuário ${userToDelete.displayName}.`,
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" /> Gestão Global de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, email, UID ou base..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={fetchData}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Loader2
                className={`mr-2 h-4 w-4 ${
                  loading ? "animate-spin" : "hidden"
                }`}
              />{" "}
              Atualizar Dados
            </Button>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <>
              {" "}
              {/* Adicionado Fragment para agrupar o <p> e <ul> */}
              <p className="text-sm text-muted-foreground mb-4">
                Exibindo {filteredUsers.length} de {allUsers.length} usuários.
              </p>
              <ul className="space-y-3">
                {filteredUsers.map((user) => (
                  <li
                    key={user.uid}
                    className="p-4 border rounded-lg bg-card shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-primary flex items-center gap-1.5">
                          {user.displayName || "Nome não informado"}
                          {user.isAdmin && (
                            <Badge variant="destructive" className="text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.authDisabled && (
                            <Badge
                              variant="outline"
                              className="text-xs border-orange-500 text-orange-600"
                            >
                              <PowerOff className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email || "Email não informado"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          UID: {user.uid}
                        </p>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenLinkModal(user)}
                            >
                              <Link2 className="mr-2 h-4 w-4" /> Vincular à Base
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setUserToSetDefaultBase(user)}
                            >
                              <KeyRound className="mr-2 h-4 w-4" /> Definir Base
                              Padrão
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setUserToToggleAdmin(user)}
                            >
                              {user.isAdmin ? (
                                <ShieldOff className="mr-2 h-4 w-4 text-orange-600" />
                              ) : (
                                <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
                              )}
                              {user.isAdmin ? "Remover Admin" : "Tornar Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(user)}
                            >
                              {user.authDisabled ? (
                                <Power className="mr-2 h-4 w-4 text-green-600" />
                              ) : (
                                <PowerOff className="mr-2 h-4 w-4 text-orange-600" />
                              )}
                              {user.authDisabled ? "Ativar" : "Inativar"} Conta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {user.associatedBases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Bases Associadas:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {user.associatedBases.map((base) => (
                            <Button
                              key={base.id}
                              variant="outline"
                              size="sm"
                              className={`h-auto text-xs px-2 py-1 ${
                                base.role === "default"
                                  ? "border-primary text-primary hover:bg-primary/10"
                                  : "hover:bg-accent"
                              }`}
                              onClick={() => {
                                if (base.role === "authorized") {
                                  // Só permite desvincular de 'authorized' por aqui
                                  setUnlinkInfo({ user, base });
                                }
                              }}
                              title={
                                base.role === "authorized"
                                  ? `Clique para desvincular ${user.displayName} de ${base.name}`
                                  : `Base padrão de ${user.displayName}`
                              }
                            >
                              {base.role === "default" ? (
                                <KeyRound className="h-3 w-3 mr-1.5" />
                              ) : (
                                <Building2 className="h-3 w-3 mr-1.5" />
                              )}
                              {base.name} (ID: {base.numberId}){" "}
                              {base.role === "authorized" && (
                                <UserX className="h-3 w-3 ml-1.5 text-muted-foreground hover:text-destructive" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.associatedBases.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhuma base associada diretamente.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => !open && setUserToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário "
                {userToDelete.displayName || userToDelete.uid}" (UID:{" "}
                {userToDelete.uid})? Esta ação é irreversível e removerá o
                usuário do sistema de autenticação, seu perfil do banco de dados
                e o desvinculará de todas as bases.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className={buttonVariants({ variant: "destructive" })}
              >
                Excluir Usuário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {userToLink && (
        <AlertDialog
          open={!!userToLink}
          onOpenChange={(open) => !open && setUserToLink(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Vincular "{userToLink.displayName || userToLink.uid}" à Base
              </AlertDialogTitle>
              <AlertDialogDescription>
                Digite o ID numérico da base à qual você deseja vincular este
                usuário.
              </AlertDialogDescription>
              <Input
                type="number"
                placeholder="ID Numérico da Base (Ex: 1, 2, 3...)"
                value={baseNumberIdToLink}
                onChange={(e) => setBaseNumberIdToLink(e.target.value)}
                className="mt-2"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToLink(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmLinkToBase}
                disabled={!baseNumberIdToLink.trim()}
              >
                Vincular Usuário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {userToToggleAdmin && (
        <AlertDialog
          open={!!userToToggleAdmin}
          onOpenChange={(open) => !open && setUserToToggleAdmin(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Alteração de Admin</AlertDialogTitle>
              <AlertDialogDescription>
                Você deseja{" "}
                {userToToggleAdmin.isAdmin
                  ? "remover os privilégios de administrador de"
                  : "promover a administrador"}{" "}
                "{userToToggleAdmin.displayName || userToToggleAdmin.uid}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToToggleAdmin(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleAdminStatus}
                className={
                  userToToggleAdmin.isAdmin
                    ? buttonVariants({ variant: "destructive" })
                    : ""
                }
              >
                {userToToggleAdmin.isAdmin ? "Remover Admin" : "Tornar Admin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {userToSetDefaultBase && (
        <AlertDialog
          open={!!userToSetDefaultBase}
          onOpenChange={(open) => !open && setUserToSetDefaultBase(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Definir Base Padrão para "
                {userToSetDefaultBase.displayName || userToSetDefaultBase.uid}"
              </AlertDialogTitle>
              <AlertDialogDescription>
                Digite o ID numérico da base que será a padrão para este
                usuário. A base padrão atual é:{" "}
                {userToSetDefaultBase.clientBaseId || "Nenhuma"}.
              </AlertDialogDescription>
              <Input
                type="number"
                placeholder="ID Numérico da Base (Ex: 1, 2, 3...)"
                value={defaultBaseNumberIdInput}
                onChange={(e) => setDefaultBaseNumberIdInput(e.target.value)}
                className="mt-2"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToSetDefaultBase(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSetDefaultBase}
                disabled={!defaultBaseNumberIdInput.trim()}
              >
                Definir Base Padrão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {unlinkInfo && (
        <AlertDialog
          open={!!unlinkInfo}
          onOpenChange={(open) => !open && setUnlinkInfo(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular Usuário da Base</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desvincular "
                {unlinkInfo.user.displayName || unlinkInfo.user.uid}" da base "
                {unlinkInfo.base.name} (ID: {unlinkInfo.base.numberId})"? O
                usuário perderá o acesso autorizado a esta base.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUnlinkInfo(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnlinkFromBase}
                className={buttonVariants({ variant: "destructive" })}
              >
                Desvincular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default GerenciarUsuariosGlobalPage;
