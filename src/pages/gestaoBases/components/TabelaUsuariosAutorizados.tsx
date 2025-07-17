import React, { useEffect, useState } from "react";
// importação do Firebase removida
// importação do Firebase removida
import { Badge } from "@/components/ui/badge";

interface UsuarioAutorizado {
  uid: string;
  displayName: string;
  email: string;
  situacao?: string;
}

interface Props {
  baseId?: string;
}

export const TabelaUsuariosAutorizados: React.FC<Props> = ({ baseId }) => {
  const [usuarios, setUsuarios] = useState<UsuarioAutorizado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!baseId) return;
    const baseRef = ref(db, `clientBases/${baseId}/authorizedUIDs`);
    const unsubscribe = onValue(baseRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.keys(data).map((uid) => ({
          uid,
          displayName: data[uid].displayName || "-",
          email: data[uid].email || "-",
          situacao: data[uid].situacao || "pendente",
        }));
        setUsuarios(lista);
      } else {
        setUsuarios([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [baseId]);

  if (!baseId) return null;

  return (
    <div>
      {loading ? (
        <div className="text-gray-500 text-sm">
          Carregando usuários autorizados...
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-gray-500 text-sm">
          Nenhum usuário autorizado para esta base.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 border-b text-left">Nome</th>
                <th className="px-3 py-2 border-b text-left">Email</th>
                <th className="px-3 py-2 border-b text-left">Situação</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.uid} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{user.displayName}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        user.situacao === "ativo"
                          ? "secondary"
                          : user.situacao === "inativo"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {user.situacao || "pendente"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
