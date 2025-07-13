import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, Users as UsersIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTableHeaderCell } from "@/components/ui/data-table";
import { db } from "@/firebase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import type { ClientBase } from "@/types/store";
import { onValue, ref, get } from "firebase/database";

interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  clientBaseId?: number | null;
  authDisabled?: boolean;
}

interface UserWithBaseInfo extends UserProfile {
  associatedBases: { id: string; name: string; numberId: number; role: "authorized" | "default" }[];
}

export const GerenciarUsuariosPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [usuarios, setUsuarios] = useState<UserWithBaseInfo[]>([]);
  const [allClientBases, setAllClientBases] = useState<ClientBase[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  
  const [modalPesquisaAberto, setModalPesquisaAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "todos",
    tipo: "todos"
  });
  const [filtrosTemporarios, setFiltrosTemporarios] = useState({
    status: "todos",
    tipo: "todos"
  });

  // Carregamento dos usuários e bases
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

        const loadedBases: ClientBase[] = basesData
          ? Object.keys(basesData).map((id) => ({
              id,
              ...basesData[id],
            }))
          : [];

        setAllClientBases(loadedBases);

        // Enriquecer usuários com informações das bases
        const usersWithBases = loadedUsers.map((user) => {
          const associatedBases: UserWithBaseInfo["associatedBases"] = [];

          loadedBases.forEach((base) => {
            // Verificar se é a base padrão do usuário
            if (user.clientBaseId === base.numberId) {
              associatedBases.push({
                id: base.id,
                name: base.name,
                numberId: base.numberId,
                role: "default"
              });
            }
            // Verificar se está nos usuários autorizados
            else if (base.authorizedUIDs && base.authorizedUIDs[user.uid]) {
              associatedBases.push({
                id: base.id,
                name: base.name,
                numberId: base.numberId,
                role: "authorized"
              });
            }
          });

          return {
            ...user,
            associatedBases
          };
        });

        setUsuarios(usersWithBases);
      } catch (error) {
        toast.error({
          title: "Erro",
          description: "Erro ao carregar dados dos usuários.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const aplicarFiltros = () => {
    setFiltros(filtrosTemporarios);
    setModalPesquisaAberto(false);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      status: "todos",
      tipo: "todos"
    };
    setFiltros(filtrosLimpos);
    setFiltrosTemporarios(filtrosLimpos);
    setBusca("");
    setModalPesquisaAberto(false);
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltrosTemporarios(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      // Filtro de busca
      if (busca.trim()) {
        const termoBusca = busca.toLowerCase().trim();
        const matchNome = usuario.displayName?.toLowerCase().includes(termoBusca);
        const matchEmail = usuario.email?.toLowerCase().includes(termoBusca);
        const matchBase = usuario.associatedBases.some(base => 
          base.name.toLowerCase().includes(termoBusca)
        );
        
        if (!matchNome && !matchEmail && !matchBase) {
          return false;
        }
      }

      // Filtro por tipo
      if (filtros.tipo !== "todos") {
        if (filtros.tipo === "admin" && !usuario.isAdmin) return false;
        if (filtros.tipo === "user" && usuario.isAdmin) return false;
      }

      // Filtro por status
      if (filtros.status !== "todos") {
        if (filtros.status === "ativo" && usuario.authDisabled) return false;
        if (filtros.status === "inativo" && !usuario.authDisabled) return false;
      }

      return true;
    });
  }, [usuarios, busca, filtros]);

  const temFiltrosAtivos = busca.trim() || filtros.status !== "todos" || filtros.tipo !== "todos";

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const getBasesText = (bases: UserWithBaseInfo["associatedBases"]) => {
    if (bases.length === 0) return "Nenhuma";
    
    const defaultBase = bases.find(b => b.role === "default");
    const authorizedBases = bases.filter(b => b.role === "authorized");
    
    let text = "";
    if (defaultBase) {
      text += `${defaultBase.name} (Padrão)`;
    }
    if (authorizedBases.length > 0) {
      if (text) text += ", ";
      text += authorizedBases.map(b => b.name).join(", ");
    }
    
    return text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto">
      <Card className="bg-[#F4F4F4]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              <CardTitle className="text-2xl font-bold">Gerenciar Usuários</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={modalPesquisaAberto} onOpenChange={setModalPesquisaAberto}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {temFiltrosAtivos && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtros de Pesquisa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tipo">Tipo de Usuário</Label>
                      <Select
                        value={filtrosTemporarios.tipo}
                        onValueChange={(value) => handleFiltroChange("tipo", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="admin">Administradores</SelectItem>
                          <SelectItem value="user">Usuários</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filtrosTemporarios.status}
                        onValueChange={(value) => handleFiltroChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={limparFiltros}>
                        Limpar
                      </Button>
                      <Button onClick={aplicarFiltros}>
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar usuário..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHeaderCell>Nome</DataTableHeaderCell>
                <DataTableHeaderCell>Email</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Tipo</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Status</DataTableHeaderCell>
                <DataTableHeaderCell>Bases Associadas</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {usuariosFiltrados.map((usuario) => (
                <DataTableRow key={usuario.uid}>
                  <DataTableCell className="font-medium">
                    {usuario.displayName || 'Nome não informado'}
                  </DataTableCell>
                  <DataTableCell>{usuario.email}</DataTableCell>
                  <DataTableCell align="center">
                    {usuario.isAdmin ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Usuário
                      </Badge>
                    )}
                  </DataTableCell>
                  <DataTableCell align="center">
                    {usuario.authDisabled ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Inativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-sm">
                      {getBasesText(usuario.associatedBases)}
                    </span>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implementar ações para usuários
                        console.log('Editar usuário', usuario.uid);
                      }}
                    >
                      Gerenciar
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
          
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{usuariosFiltrados.length}</strong> registro(s)
            {temFiltrosAtivos && (
              <span className="ml-2">
                (filtrado de {usuarios.length} registros)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
