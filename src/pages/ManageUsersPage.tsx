import React, { useState, useEffect } from "react";
import UserAccessMatrix from "@/components/UserAccessMatrix";
import { db } from "@/firebase"; // Importar db para Realtime Database
import { ref, onValue } from "firebase/database"; // Importar funções do Realtime Database

// Definir uma interface para os dados do usuário que esperamos
interface UserData {
  id: string;
  nome?: string;
  email?: string;
  ultimaBaseAcessada?: string;
  ultimoAcesso?: string | number;
}

const ManageUsersPage: React.FC = () => {
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(db, "users"); // Caminho para os usuários no Firebase
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
        console.error("Firebase read error (ManageUsersPage):", error);
        setErrorUsers("Falha ao carregar dados dos usuários.");
        setLoadingUsers(false);
        setUsersList([]);
      }
    );

    // Cleanup: Desinscrever do listener quando o componente desmontar
    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-8">
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

export default ManageUsersPage;
