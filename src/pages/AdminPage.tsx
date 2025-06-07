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
import { ref, onValue, serverTimestamp, get, remove, set, push } from "firebase/database";
import { Users } from "lucide-react";
import { BaseManagement, ClientBase as ClientBaseType } from "./AdminPage/components/BaseManagement"; // Importar ClientBase como ClientBaseType
import { AdminManagement } from "./AdminPage/components/AdminManagement";

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
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