import UserAccessMatrix from "@/components/UserAccessMatrix";
import React, { useEffect, useState } from "react";

// Definir uma interface para os dados do usuário que esperamos
interface UserData {
  id: string;
  nome?: string;
  email?: string;
  ultimaBaseAcessada?: string;
  ultimoAcesso?: string | number;
}

const GerenciarUsuarioPage: React.FC = () => {
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  useEffect(() => {
    // const usersRef = ref(db, "users"); // Firebase removido
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const loadedUsers: UserData[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setUsersList(loadedUsers);
        } else {
          setUsersList([]);
        }
        setLoadingUsers(false);
        setErrorUsers(null);
      },
      (error) => {
        console.error("Database read error (ManageUsersPage):", error);
        setErrorUsers("Falha ao carregar dados dos usuários.");
        setLoadingUsers(false);
        setUsersList([]);
      }
    );

    // Cleanup: Desinscrever do listener quando o componente desmontar
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-[90%] mx-auto p-4 space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <UserAccessMatrix
          users={usersList}
          loading={loadingUsers}
          error={errorUsers}
        />
      </section>
    </div>
  );
};

export default GerenciarUsuarioPage;
