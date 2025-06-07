import React, { useState, useEffect, useMemo } from "react";
import { db, functions as firebaseFunctions } from "@/firebase"; // Importar functions
import { ref, onValue, get } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { httpsCallable } from "firebase/functions"; // Importar httpsCallable
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Users, Search, Building2, KeyRound, ShieldCheck, ShieldOff, MoreHorizontal, Link2, Edit3, UserX, Trash2, Power, PowerOff } from "lucide-react";
import type { ClientBase } from "@/types/store";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  clientBaseId?: number | null; 
  authDisabled?: boolean; // Novo campo para status de autenticação
}

interface UserWithBaseInfo extends UserProfile {
  associatedBases: { id: string; name: string; numberId: number; role: "authorized" | "default" }[];
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

  useEffect(() => {
    setLoading(true);
    const usersRef = ref(db, "users");
    const clientBasesRef = ref(db, "clientBases");

    const fetchData = async () => {
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
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar dados globais de usuários e bases:", err);
        setError("Falha ao carregar dados. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const usersWithBases = useMemo(() => {
    return allUsers.map((user) => {
      const associatedBases: UserWithBaseInfo["associatedBases"] = [];

      allClientBases.forEach((base) => {
        // Verifica se é a base padrão do usuário
        if (user.clientBaseId && user.clientBaseId === base.numberId) {
          if (!associatedBases.find(b => b.id === base.id)) { // Evitar duplicidade se também for autorizado
            associatedBases.push({ id: base.id, name: base.name, numberId: base.numberId, role: "default" });
          }
        }
        // Verifica se o usuário está nos authorizedUIDs da base
        if (base.authorizedUIDs && base.authorizedUIDs[user.uid]) {
           if (!associatedBases.find(b => b.id === base.id)) { // Evitar duplicidade
            associatedBases.push({ id: base.id, name: base.name, numberId: base.numberId, role: "authorized" });
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
        user.associatedBases.some(base => base.name.toLowerCase().includes(lowerSearchTerm) || base.numberId.toString().includes(lowerSearchTerm))
    );
  }, [usersWithBases, searchTerm]);

  const handleOpenLinkModal = (user: UserWithBaseInfo) => {
    setUserToLink(user);
    setBaseNumberIdToLink("");
  };

  const handleConfirmLinkToBase = async () => {
    if (!userToLink || !baseNumberIdToLink.trim()) {
      toast({ title: "Erro", description: "Usuário ou ID da base inválido.", variant: "destructive" });
      return;
    }
    const targetBaseNumberId = parseInt(baseNumberIdToLink, 10);
    if (isNaN(targetBaseNumberId)) {
      toast({ title: "Erro", description: "ID da base deve ser um número.", variant: "destructive" });
      return;
    }

    const targetBase = allClientBases.find(b => b.numberId === targetBaseNumberId);

    if (!targetBase) {
      toast({ title: "Erro", description: `Nenhuma base encontrada com o ID numérico: ${targetBaseNumberId}.`, variant: "destructive" });
      return;
    }

    if (targetBase.authorizedUIDs && targetBase.authorizedUIDs[userToLink.uid]) {
      toast({ title: "Informação", description: `${userToLink.displayName || 'Usuário'} já está vinculado à base ${targetBase.name}.`, variant: "default" });
      setUserToLink(null);
      return;
    }

    try {
      const baseAuthUserRef = ref(db, `clientBases/${targetBase.id}/authorizedUIDs/${userToLink.uid}`);
      await set(baseAuthUserRef, {
        displayName: userToLink.displayName || "Nome não informado",
        email: userToLink.email || "Email não informado",
      });

      // Atualizar localmente para refletir a mudança imediatamente (opcional, mas bom para UX)
      setAllClientBases(prevBases => prevBases.map(b => {
        if (b.id === targetBase.id) {
          return {
            ...b,
            authorizedUIDs: {
              ...b.authorizedUIDs,
              [userToLink.uid]: {
                displayName: userToLink.displayName || "Nome não informado",
                email: userToLink.email || "Email não informado",
              }
            }
          };
        }
        return b;
      }));

      toast({ title: "Sucesso", description: `${userToLink.displayName || 'Usuário'} vinculado à base ${targetBase.name} (ID: ${targetBase.numberId}).`, variant: "success" });
    } catch (err) {
      console.error("Erro ao vincular usuário à base:", err);
      toast({ title: "Erro", description: "Não foi possível vincular o usuário à base.", variant: "destructive" });
    } finally {
      setUserToLink(null);
    }
  };

  // Placeholder functions for other actions
  const handleEditUser = (user: UserWithBaseInfo) => toast({ title: "Ação: Editar Usuário", description: `TODO: Implementar edição para ${user.displayName}.`, duration: 5000 });
  
  const handleToggleUserStatus = async (user: UserWithBaseInfo) => {
    const newDisabledStatus = !(user.authDisabled === true); // Se for undefined ou false, se tornará true (desabilitado)
    const actionText = newDisabledStatus ? "desativar" : "ativar";

    try {
      const toggleUserAuthStatusFunction = httpsCallable(firebaseFunctions, 'toggleUserAuthStatus');
      const result = await toggleUserAuthStatusFunction({
        targetUid: user.uid,
        disable: newDisabledStatus,
      });

      const resultData = result.data as { success: boolean; message: string };

      if (resultData.success) {
        toast({ title: "Sucesso!", description: resultData.message, variant: "success" });
        // Atualizar o estado local do usuário
        setAllUsers(prevUsers =>
          prevUsers.map(u =>
            u.uid === user.uid ? { ...u, authDisabled: newDisabledStatus } : u
          )
        );
      } else {
        toast({ title: `Erro ao ${actionText} usuário`, description: resultData.message || "Ocorreu um erro.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error(`Erro ao chamar Cloud Function toggleUserAuthStatus para ${actionText} usuário:`, error);
      toast({ title: "Erro na Operação", description: error.message || `Não foi possível ${actionText} o usuário.`, variant: "destructive" });
    }
  };

  const handleDeleteUser = (user: UserWithBaseInfo) => toast({ title: "Ação: Excluir Usuário", description: `TODO: Implementar exclusão para ${user.displayName}. Requer Admin SDK e limpeza no RTDB.`, duration: 5000 });

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
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, email, UID ou base..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            <ul className="space-y-3">
              {filteredUsers.map((user) => (
                <li key={user.uid} className="p-4 border rounded-lg bg-card shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-primary flex items-center gap-1.5">
                        {user.displayName || "Nome não informado"}
                        {user.isAdmin && <Badge variant="destructive" className="text-xs"><ShieldCheck className="h-3 w-3 mr-1"/>Admin</Badge>}
                        {user.authDisabled && <Badge variant="outline" className="text-xs border-orange-500 text-orange-600"><PowerOff className="h-3 w-3 mr-1"/>Inativo</Badge>}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email || "Email não informado"}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">UID: {user.uid}</p>
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
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenLinkModal(user)}>
                            <Link2 className="mr-2 h-4 w-4" /> Vincular à Base
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                            {user.authDisabled ? <Power className="mr-2 h-4 w-4 text-green-600" /> : <PowerOff className="mr-2 h-4 w-4 text-orange-600" />} 
                            {user.authDisabled ? "Ativar" : "Inativar"} Conta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {user.associatedBases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Bases Associadas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {user.associatedBases.map((base) => (
                          <Badge key={base.id} variant={base.role === 'default' ? "default" : "secondary"} className="text-xs">
                            {base.role === 'default' ? <KeyRound className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
                            {base.name} (ID: {base.numberId})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.associatedBases.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhuma base associada diretamente.</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {userToLink && (
        <AlertDialog open={!!userToLink} onOpenChange={(open) => !open && setUserToLink(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vincular "{userToLink.displayName || userToLink.uid}" à Base</AlertDialogTitle>
              <AlertDialogDescription>
                Digite o ID numérico da base à qual você deseja vincular este usuário.
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
              <AlertDialogCancel onClick={() => setUserToLink(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmLinkToBase} disabled={!baseNumberIdToLink.trim()}>
                Vincular Usuário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default GerenciarUsuariosGlobalPage;