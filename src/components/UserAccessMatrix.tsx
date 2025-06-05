import React, { useEffect, useState } from "react";
import { db } from "@/firebase"; // Importar a instância do Realtime Database
import { ref, onValue } from "firebase/database";

// Definir uma interface para os dados do usuário que esperamos
interface UserData {
  id: string;
  nome?: string; // Supondo que você tenha um campo 'nome'
  email?: string; // E 'email'
  ultimaBaseAcessada?: string; // Campo para a "base"
  ultimoAcesso?: string | number; // Timestamp ou string formatada
  // Adicione outros campos que você armazena para cada usuário
}

const UserAccessMatrix: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(db, "users"); // Assumindo que seus usuários estão em '/users'
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const loadedUsers: UserData[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setUsers(loadedUsers);
        } else {
          setUsers([]);
        }
        setLoading(false);
        setError(null); // Limpar erro anterior em caso de sucesso
      },
      (errorCallback) => {
        // Renomeado o parâmetro para clareza, ou use 'error' consistentemente
        setError("Falha ao carregar dados dos usuários.");
        setLoading(false);
        setUsers([]); // Limpar usuários em caso de erro
      }
    );

    // Cleanup: Desinscrever do listener quando o componente desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) return <p className="text-yellow-600">Carregando usuários...</p>;
  if (error)
    return <p className="text-red-600">Erro ao carregar usuários: {error}</p>;

  // Função para formatar o timestamp do último acesso
  const formatLastAccess = (timestamp: string | number | undefined) => {
    if (!timestamp) return "N/A";
    // Se for um número (timestamp Unix), converta para Date
    // Se for uma string, tente converter. Ajuste conforme o formato do seu timestamp.
    const date = new Date(
      typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp
    );
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleString();
  };

  return (
    <div className="overflow-x-auto">
      {users.length === 0 && !loading && (
        // Removido "ou dados ainda não carregados." pois !loading já cobre isso.
        <p className="text-gray-500">Nenhum usuário encontrado.</p>
      )}
      {users.length > 0 && (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nome
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Última Base Acessada
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Último Acesso
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.nome || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.ultimaBaseAcessada || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLastAccess(user.ultimoAcesso)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserAccessMatrix;
