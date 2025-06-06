import React, { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase";
import {
  ref,
  set,
  push,
  onValue,
  serverTimestamp,
  get,
} from "firebase/database";
import { useAuth } from "@/hooks/useAuth";
import { ClientBase } from "@/types/store"; // Certifique-se que este tipo está correto
import { Badge } from "@/components/ui/badge";

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [clientBases, setClientBases] = useState<ClientBase[]>([]);
  const [newBaseName, setNewBaseName] = useState("");
  // const [newBaseAuthorizedUIDs, setNewBaseAuthorizedUIDs] = useState(""); // Removido - UIDs serão via convite
  const [nextNumberId, setNextNumberId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(
    null
  );
  const [userEmailsMap, setUserEmailsMap] = useState<{ [uid: string]: string }>(
    {}
  );
  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]); // Para listar admins
  const [uidToPromote, setUidToPromote] = useState("");
  const [isPromotingUser, setIsPromotingUser] = useState(false);

  useEffect(() => {
    const clientBasesRef = ref(db, "clientBases");
    const unsubscribe = onValue(clientBasesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const basesArray: ClientBase[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setClientBases(basesArray);

        // Determinar o próximo numberId
        if (basesArray.length === 0) {
          setNextNumberId(1);
        } else {
          const maxId = Math.max(...basesArray.map((b) => b.numberId || 0), 0);
          setNextNumberId(maxId + 1);
        }
      } else {
        setClientBases([]);
        setNextNumberId(1);
      }
    });
    return () => unsubscribe();
  }, []);

  // Efeito para buscar administradores
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribeAdmins = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const loadedAdmins: AppUser[] = [];
        Object.keys(usersData).forEach((uid) => {
          const userProfile = usersData[uid]?.profile;
          if (userProfile && userProfile.isAdmin === true) {
            loadedAdmins.push({
              uid,
              displayName: userProfile.displayName || "N/A",
              email: userProfile.email || "N/A",
              // Adicione outros campos de AppUser se necessário, mas mantenha simples para a lista
            } as AppUser); // Type assertion
          }
        });
        setAdminUsers(loadedAdmins);
      } else {
        setAdminUsers([]);
      }
    });
    return () => unsubscribeAdmins();
  }, []);

  useEffect(() => {
    const fetchEmailsForBases = async () => {
      const newEmailsMap = { ...userEmailsMap };
      let mapNeedsUpdate = false;

      for (const base of clientBases) {
        if (base.authorizedUIDs) {
          for (const uid of Object.keys(base.authorizedUIDs)) {
            if (!newEmailsMap[uid]) {
              // Só busca se ainda não tivermos o email
              try {
                const emailRef = ref(db, `users/${uid}/profile/email`); // Corrigido para ref
                const snapshot = await get(emailRef);
                if (snapshot.exists()) {
                  newEmailsMap[uid] = snapshot.val();
                } else {
                  newEmailsMap[uid] = "Email não encontrado"; // Fallback
                }
                mapNeedsUpdate = true;
              } catch (error) {
                console.error(`Erro ao buscar email para UID ${uid}:`, error);
                newEmailsMap[uid] = "Erro ao buscar"; // Fallback
                mapNeedsUpdate = true;
              }
            }
          }
        }
      }
      if (mapNeedsUpdate) {
        setUserEmailsMap(newEmailsMap);
      }
    };

    if (clientBases.length > 0) {
      fetchEmailsForBases();
    }
  }, [clientBases]); // Dependência userEmailsMap removida para evitar loop se a atualização for parcial

  const handleAddClientBase = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBaseName.trim() || !currentUser || nextNumberId === null) {
      toast({
        title: "Erro",
        description:
          "Nome da base é obrigatório e o ID numérico deve ser válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Verificar se o numberId já existe para evitar duplicidade (embora o useEffect tente pegar o próximo)
    const existingBaseWithNumberId = clientBases.find(
      (b) => b.numberId === nextNumberId
    );
    if (existingBaseWithNumberId) {
      toast({
        title: "Erro de Conflito",
        description: `O ID Numérico ${nextNumberId} já está em uso. Recarregue ou ajuste.`,
        variant: "destructive",
      });
      setIsLoading(false);
      // Recalcular nextNumberId em caso de conflito (pode acontecer se houver escritas concorrentes)
      const maxId = Math.max(...clientBases.map((b) => b.numberId || 0), 0);
      setNextNumberId(maxId + 1);
      return;
    }

    const clientBasesRef = ref(db, "clientBases");
    const newClientBaseRef = push(clientBasesRef);

<<<<<<< HEAD
=======
    // authorizedUIDs começará vazio, usuários serão adicionados via convite
>>>>>>> d7c2fd557b3c7b7226be7acfee44988c85309900
    const authorizedUIDsObject: { [key: string]: boolean } = {
      [currentUser.uid]: true,
    };

    const baseData: Omit<ClientBase, "id"> = {
      name: newBaseName,
      numberId: nextNumberId,
      authorizedUIDs: authorizedUIDsObject,
      createdAt: serverTimestamp() as unknown as number, // Firebase preencherá
      createdBy: currentUser.uid,
    };

    try {
      await set(newClientBaseRef, baseData);
      toast({
        title: "Sucesso!",
        description: `Base "${newBaseName}" criada com ID Numérico ${nextNumberId}.`,
      });
      setNewBaseName("");
      // O useEffect atualizará o nextNumberId automaticamente quando a lista de bases mudar
    } catch (error) {
      console.error("Erro ao criar base:", error);
      toast({
        title: "Erro ao criar base",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInviteLink = async (clientBaseId: string) => {
    if (!currentUser) return;
    setGeneratedInviteLink(null); // Limpa link anterior

    const invitesRef = ref(db, "invites");
    const newInviteRef = push(invitesRef); // Gera um token único para o convite
    const inviteToken = newInviteRef.key;

    if (!inviteToken) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o token do convite.",
        variant: "destructive",
      });
      return;
    }

    const selectedClientBase = clientBases.find((b) => b.id === clientBaseId);
    if (!selectedClientBase) {
      toast({
        title: "Erro",
        description: "Base não encontrada para gerar convite.",
        variant: "destructive",
      });
      return;
    }

    const inviteData = {
      clientBaseId: clientBaseId,
      clientBaseNumberId: selectedClientBase.numberId, // Adicionar numberId
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      status: "pending", // pending, used, expired
    };

    try {
      await set(newInviteRef, inviteData);
      const inviteLink = `${window.location.origin}/convite/${inviteToken}`;
      setGeneratedInviteLink(inviteLink);
      toast({
        title: "Link de Convite Gerado!",
        description: "Copie o link abaixo e envie ao usuário.",
      });
    } catch (error) {
      console.error("Erro ao criar convite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o convite.",
        variant: "destructive",
      });
    }
  };

  const handlePromoteToAdmin = async (e: FormEvent) => {
    e.preventDefault();
    if (!uidToPromote.trim() || !currentUser?.isAdmin) {
      toast({
        title: "Erro",
        description: "UID do usuário é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    if (uidToPromote === currentUser.uid) {
      toast({
        title: "Aviso",
        description:
          "Você não pode alterar sua própria permissão de admin aqui.",
        variant: "default",
      });
      return;
    }

    setIsPromotingUser(true);
    const userProfileAdminFlagRef = ref(
      db,
      `users/${uidToPromote}/profile/isAdmin`
    );
    const userProfileClientBaseIdRef = ref(
      db,
      `users/${uidToPromote}/profile/clientBaseId`
    );

    try {
      // Verificar se o usuário existe antes de promover
      const userProfileRef = ref(db, `users/${uidToPromote}/profile`);
      const userSnapshot = await get(userProfileRef);
      if (!userSnapshot.exists()) {
        toast({
          title: "Erro",
          description: "Usuário com este UID não encontrado.",
          variant: "destructive",
        });
        setIsPromotingUser(false);
        return;
      }

      await set(userProfileAdminFlagRef, true);
      await set(userProfileClientBaseIdRef, null); // Admins não têm clientBaseId
      toast({
        title: "Sucesso!",
        description: `Usuário ${uidToPromote} agora é um administrador.`,
      });
      setUidToPromote("");
    } catch (error) {
      console.error("Erro ao promover usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível promover o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsPromotingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Bases de Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleAddClientBase}
            className="space-y-4 p-4 border rounded-md bg-slate-50"
          >
            <h3 className="text-lg font-semibold">Criar Nova Base</h3>
            <div>
              <Label htmlFor="baseName">Nome da Base *</Label>
              <Input
                id="baseName"
                value={newBaseName}
                onChange={(e) => setNewBaseName(e.target.value)}
                placeholder="Ex: Cliente Alpha"
                required
              />
            </div>
            <div>
              <Label htmlFor="baseNumberId">ID Numérico (Automático)</Label>
              <Input
                id="baseNumberId"
                value={nextNumberId ?? "Carregando..."}
                readOnly
                disabled
              />
            </div>
            {/* Campo de UIDs/Emails removido do formulário de criação */}
            <Button type="submit" disabled={isLoading || nextNumberId === null}>
              {isLoading
                ? "Criando..."
                : nextNumberId === null
                ? "Aguarde ID..."
                : "Criar Base"}
            </Button>
          </form>

          {generatedInviteLink && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <Label className="font-semibold text-green-700">
                Link de Convite Gerado:
              </Label>
              <Input
                type="text"
                value={generatedInviteLink}
                readOnly
                className="mt-1 bg-white"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  navigator.clipboard
                    .writeText(generatedInviteLink)
                    .then(() => toast({ description: "Link copiado!" }))
                }
              >
                Copiar Link
              </Button>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold mt-6 mb-2">
              Bases Existentes
            </h3>
            {clientBases.length === 0 ? (
              <p>Nenhuma base de cliente cadastrada.</p>
            ) : (
              <ul className="space-y-2">
                {clientBases
                  .sort((a, b) => (a.numberId || 0) - (b.numberId || 0))
                  .map((base) => (
                    <li
                      key={base.id}
                      className="p-3 border rounded-md flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{base.name}</span>{" "}
                        <Badge variant="secondary">
                          ID Num: {base.numberId}
                        </Badge>
                        <p className="text-sm text-gray-600">
                          UIDs Autorizados:{" "}
                          {typeof base.authorizedUIDs === "object" &&
                          base.authorizedUIDs !== null
                            ? Object.keys(base.authorizedUIDs).join(", ")
                            : Array.isArray(base.authorizedUIDs) // Fallback caso a estrutura antiga ainda exista
                            ? base.authorizedUIDs.join(", ")
                            : "Nenhum"}
                        </p>
                        <p className="text-xs text-gray-400">UUID: {base.id}</p>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInviteLink(base.id)}
                        >
                          Gerar Convite
                        </Button>
                        {/* Adicionar botões de Editar/Deletar aqui no futuro */}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Administradores do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handlePromoteToAdmin}
            className="space-y-4 p-4 border rounded-md bg-slate-50"
          >
            <h3 className="text-lg font-semibold">
              Promover Usuário a Administrador
            </h3>
            <div>
              <Label htmlFor="uidToPromote">
                UID do Usuário a ser Promovido *
              </Label>
              <Input
                id="uidToPromote"
                value={uidToPromote}
                onChange={(e) => setUidToPromote(e.target.value)}
                placeholder="Cole o UID do usuário aqui"
                required
              />
            </div>
            <Button type="submit" disabled={isPromotingUser}>
              {isPromotingUser ? "Promovendo..." : "Tornar Administrador"}
            </Button>
          </form>

          <div>
            <h3 className="text-lg font-semibold mt-6 mb-2">
              Administradores Atuais
            </h3>
            {adminUsers.length === 0 ? (
              <p>Nenhum administrador adicional cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {adminUsers.map((admin) => (
                  <li key={admin.uid} className="p-3 border rounded-md">
                    <p className="font-medium">{admin.displayName}</p>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="text-xs text-gray-400">UID: {admin.uid}</p>
                    {/* Futuramente: Botão para revogar admin, exceto para o próprio admin logado se for o "super admin" */}
                    {/* {currentUser?.uid !== admin.uid && (
                       <Button variant="destructive" size="sm" onClick={() => handleRevokeAdmin(admin.uid)}>Revogar</Button>
                    )} */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
