import React, { useState, useEffect, FormEvent } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase";
import { ref, onValue, serverTimestamp, get, remove, set, push, update } from "firebase/database";
import { Users } from "lucide-react";
import { BaseManagement, ClientBase as ClientBaseType } from "./AdminPage/components/BaseManagement"; // Importar ClientBase como ClientBaseType
import { AdminManagement } from "./AdminPage/components/AdminManagement";

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  // O campo isAdmin é inferido pela presença no nó 'users' com profile.isAdmin = true
  // Não precisa estar explicitamente aqui se já é tratado na lógica de carregamento
  isAdmin?: boolean;
}

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Renomear ClientBase para ClientBaseType para evitar conflito de nome se ClientBase for usado em outro lugar
  const [clientBases, setClientBases] = useState<ClientBaseType[]>([]);
  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]);
  const [baseCreatorsMap, setBaseCreatorsMap] = useState<{ [uid: string]: string }>({});

  const [nextNumberId, setNextNumberId] = useState<number | null>(null);
  
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const [userToRevoke, setUserToRevoke] = useState<AppUser | null>(null);
  const [userToRemove, setUserToRemove] = useState<{ user: { uid: string; displayName: string }; base: ClientBase } | null>(null);
  const [baseToDelete, setBaseToDelete] = useState<ClientBaseType | null>(null); // Estado para a base a ser excluída
  const [baseToToggleStatus, setBaseToToggleStatus] = useState<ClientBaseType | null>(null); // Estado para ativar/inativar base
  const [inactivationReason, setInactivationReason] = useState<string>(""); // Estado para o motivo da inativação

  useEffect(() => {
    const clientBasesRef = ref(db, "clientBases");
    const unsubscribe = onValue(clientBasesRef, (snapshot) => {
      const data = snapshot.val();
      const basesArray: ClientBaseType[] = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setClientBases(basesArray);

      const maxId = basesArray.length > 0 ? Math.max(...basesArray.map((b) => b.numberId || 0)) : 0;
      setNextNumberId(maxId + 1);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribeAdmins = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const loadedAdmins: AppUser[] = [];
      if (usersData) {
        Object.keys(usersData).forEach((uid) => {
          const userProfile = usersData[uid]?.profile;
          if (userProfile?.isAdmin === true) {
            loadedAdmins.push({
              uid,
              displayName: userProfile.displayName || "N/A",
              email: userProfile.email || "N/A",
              isAdmin: true, // Adicionar a propriedade isAdmin
            });
          }
        });
      }
      setAdminUsers(loadedAdmins);
    });
    return () => unsubscribeAdmins();
  }, []);

  useEffect(() => {
    const fetchCreatorNames = async () => {
      if (clientBases.length === 0) return;
      const uidsToFetch = new Set<string>(clientBases.map(base => base.createdBy).filter(uid => !baseCreatorsMap[uid]));
      if (uidsToFetch.size === 0) return;

      const newCreatorsMap = { ...baseCreatorsMap };
      for (const uid of uidsToFetch) {
        try {
          const userProfileRef = ref(db, `users/${uid}/profile/displayName`);
          const snapshot = await get(userProfileRef);
          newCreatorsMap[uid] = snapshot.exists() ? snapshot.val() : "Desconhecido";
        } catch (error) {
          console.error(`Erro ao buscar nome do criador para UID ${uid}:`, error);
          newCreatorsMap[uid] = "Erro ao buscar";
        }
      }
      setBaseCreatorsMap(newCreatorsMap);
    };
    fetchCreatorNames();
  }, [clientBases, baseCreatorsMap]);

  const handleGenerateInviteLinkForBase = async (base: ClientBaseType) => {
    if (!currentUser) return;
    setGeneratedInviteLink(null);

    const newInviteRef = push(ref(db, "invites"));
    const inviteToken = newInviteRef.key;

    if (!inviteToken) {
      toast({ title: "Erro", description: "Não foi possível gerar o token do convite.", variant: "destructive" });
      return;
    }

    const inviteData = {
      clientBaseId: base.id,
      clientBaseNumberId: base.numberId,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      status: "pending",
    };

    try {
      await set(newInviteRef, inviteData);
      const inviteLink = `${window.location.origin}/convite/${inviteToken}`;
      setGeneratedInviteLink(inviteLink);
      toast({ title: "Link de Convite Gerado!", description: "Copie o link e envie ao usuário." });
    } catch (error) {
      console.error("Erro ao criar convite:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o convite.", variant: "destructive" });
    }
  };

  const confirmRevokeAdmin = async () => {
    if (!userToRevoke || !currentUser || userToRevoke.uid === currentUser.uid) return;
    
    try {
      await set(ref(db, `users/${userToRevoke.uid}/profile/isAdmin`), false);
      toast({ title: "Sucesso", description: `Privilégios de admin revogados para ${userToRevoke.displayName}.`, variant: "success" });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível revogar os privilégios.", variant: "destructive" });
    } finally {
      setUserToRevoke(null);
    }
  };

  const confirmRemoveUserFromBase = async () => {
    if (!userToRemove) return;
    const { user, base } = userToRemove; // base aqui é ClientBaseType

    try {
      const userRef = ref(db, `clientBases/${base.id}/authorizedUIDs/${user.uid}`);
      await remove(userRef);
      toast({ title: "Sucesso", description: `${user.displayName} foi removido da base ${base.name}.` });
    } catch(error: any) {
      toast({ title: "Erro", description: "Não foi possível remover o usuário da base.", variant: "destructive" });
    } finally {
      setUserToRemove(null);
    }
  };

  const handleSetBaseToDelete = (base: ClientBaseType | null) => {
    setBaseToDelete(base);
  };

  const handleDeleteBaseConfirm = async () => {
    if (!baseToDelete) return;

    try {
      await remove(ref(db, `clientBases/${baseToDelete.id}`));
      toast({
        title: "Sucesso!",
        description: `Base "${baseToDelete.name}" excluída com sucesso.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Erro ao excluir base:", error);
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir a base "${baseToDelete.name}".`,
        variant: "destructive",
      });
    } finally {
      setBaseToDelete(null); // Fecha o diálogo
    }
  };

  const handleSetBaseToToggleStatus = (base: ClientBaseType) => {
    setBaseToToggleStatus(base);
    if (base.ativo) { // Se for inativar, limpa o motivo anterior para o input
      setInactivationReason("");
    } else { // Se for ativar, pode pré-preencher com o motivo existente, ou limpar
      setInactivationReason(base.motivo_inativo || "");
    }
  };

  const handleToggleBaseStatusConfirm = async () => {
    if (!baseToToggleStatus) return;

    const newStatus = !baseToToggleStatus.ativo;
    const updates: { ativo: boolean; motivo_inativo: string | null } = {
      ativo: newStatus,
      motivo_inativo: newStatus ? null : (inactivationReason.trim() || "Motivo não especificado"),
    };

    if (!newStatus && !inactivationReason.trim()) {
      toast({ title: "Atenção", description: "Por favor, forneça um motivo para inativar a base.", variant: "destructive" });
      return;
    }

    try {
      await update(ref(db, `clientBases/${baseToToggleStatus.id}`), updates);
      toast({
        title: "Sucesso!",
        description: `Base "${baseToToggleStatus.name}" foi ${newStatus ? 'ativada' : 'inativada'}.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Erro ao alterar status da base:", error);
      toast({ title: "Erro", description: "Não foi possível alterar o status da base.", variant: "destructive" });
    } finally {
      setBaseToToggleStatus(null);
      setInactivationReason("");
    }
  };

  return (
    <>
      <AlertDialog open={!!userToRevoke} onOpenChange={(open) => !open && setUserToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar privilégios de Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o status de administrador de <strong>{userToRevoke?.displayName}</strong>. Ele perderá acesso a este painel. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário da Base?</AlertDialogTitle>
            <AlertDialogDescription>
          Você tem certeza que deseja remover <strong>{userToRemove?.user.displayName || "este usuário"}</strong> da base <strong>{userToRemove?.base.name}</strong>? O usuário perderá o acesso aos dados desta base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveUserFromBase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Remoção</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para confirmar exclusão de base */}
      {baseToDelete && (
        <AlertDialog open={!!baseToDelete} onOpenChange={(open) => !open && setBaseToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão da Base</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a base "{baseToDelete.name}" (ID: {baseToDelete.numberId})?
                Esta ação não pode ser desfeita. Todos os dados associados a esta base (lojas, movimentações, usuários autorizados, etc.)
                serão afetados ou perdidos se não houver uma estratégia de arquivamento ou remoção em cascata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBaseToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBaseConfirm} className="bg-red-600 hover:bg-red-700 text-destructive-foreground">Excluir Permanentemente</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* AlertDialog para confirmar ativação/inativação de base */}
      {baseToToggleStatus && (
        <AlertDialog open={!!baseToToggleStatus} onOpenChange={(open) => { if (!open) { setBaseToToggleStatus(null); setInactivationReason(""); }}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {baseToToggleStatus.ativo ? "Inativar" : "Ativar"} Base "{baseToToggleStatus.name}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {baseToToggleStatus.ativo 
                  ? "Ao inativar, o acesso à base será bloqueado. Por favor, informe o motivo:" 
                  : `Deseja reativar a base "${baseToToggleStatus.name}"? O motivo da inativação anterior foi: "${baseToToggleStatus.motivo_inativo || 'Não especificado'}"`}
              </AlertDialogDescription>
              {baseToToggleStatus.ativo && (
                <textarea
                  value={inactivationReason}
                  onChange={(e) => setInactivationReason(e.target.value)}
                  placeholder="Motivo da inativação (obrigatório)"
                  className="mt-2 w-full p-2 border rounded bg-background text-foreground"
                />
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setBaseToToggleStatus(null); setInactivationReason(""); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleToggleBaseStatusConfirm} className={baseToToggleStatus.ativo ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-green-500 hover:bg-green-600"}>{baseToToggleStatus.ativo ? "Confirmar Inativação" : "Confirmar Ativação"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" /> Painel Administrativo
        </h1>

        <BaseManagement
          clientBases={clientBases}
          nextNumberId={nextNumberId}
          baseCreatorsMap={baseCreatorsMap}
          onGenerateInviteLink={handleGenerateInviteLinkForBase}
          generatedInviteLink={generatedInviteLink}
          onSetUserToRemove={setUserToRemove}
          onSetBaseToDelete={handleSetBaseToDelete}
          onSetBaseToToggleStatus={handleSetBaseToToggleStatus} // Passar a nova função
        />

        <AdminManagement
          adminUsers={adminUsers}
          onSetUserToRevoke={setUserToRevoke}
        />
      </div>
    </>
  );
};

export default AdminPage;