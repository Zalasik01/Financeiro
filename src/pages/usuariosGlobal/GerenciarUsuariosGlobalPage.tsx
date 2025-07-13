import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/status-badge";
import { SortableTableHeader } from "@/components/ui/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTableHeaderCell } from "@/components/ui/data-table";
import { db } from "@/firebase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import type { ClientBase } from "@/types/store";
import { onValue, ref } from "firebase/database";

interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  clientBaseId?: number | null;
  authDisabled?: boolean;
  createdAt?: number;
}

interface UserWithBaseInfo extends UserProfile {
  associatedBases: { id: string; name: string; numberId: number; role: "authorized" | "default" }[];
}

export const GerenciarUsuariosGlobalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [usuarios, setUsuarios] = useState<UserWithBaseInfo[]>([]);
  const [clientBases, setClientBases] = useState<ClientBase[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  
  const [modalPesquisaAberto, setModalPesquisaAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "todos",
    tipo: "todos",
    base: "todas"
  });
  const [filtrosTemporarios, setFiltrosTemporarios] = useState({
    status: "todos",
    tipo: "todos",
    base: "todas"
  });

  // Carregamento das bases
  useEffect(() => {
    const clientBasesRef = ref(db, "clientBases");
    const unsubscribe = onValue(clientBasesRef, (snapshot) => {
      const data = snapshot.val();
      const basesArray: ClientBase[] = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setClientBases(basesArray);
    });
    return () => unsubscribe();
  }, []);

  // Carregamento dos usuários
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.keys(data).map((uid) => {
          const user = data[uid];
          const userWithBases: UserWithBaseInfo = {
            uid,
            displayName: user.profile?.displayName || user.displayName,
            email: user.profile?.email || user.email,
            isAdmin: user.profile?.isAdmin || false,
            clientBaseId: user.profile?.clientBaseId || null,
            authDisabled: user.profile?.authDisabled || false,
            createdAt: user.createdAt || Date.now(),
            associatedBases: []
          };

          // Mapear bases associadas
          if (clientBases.length > 0) {
            clientBases.forEach((base) => {
              if (base.authorizedUIDs && base.authorizedUIDs[uid]) {
                userWithBases.associatedBases.push({
                  id: base.id,
                  name: base.name,
                  numberId: base.numberId || 0,
                  role: userWithBases.clientBaseId === base.numberId ? "default" : "authorized"
                });
              }
            });
          }

          return userWithBases;
        });
        setUsuarios(usersArray);
      } else {
        setUsuarios([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [clientBases]);

  const navegarParaNovo = () => {
    navigate('/admin/gerenciar-usuarios-global/novo');
  };

  const navegarParaEditar = (uid: string) => {
    navigate(`/admin/gerenciar-usuarios-global/editar/${uid}`);
  };

  const navegarParaVisualizarUsuario = (uid: string) => {
    navigate(`/admin/gerenciar-usuarios-global/editar/${uid}`);
  };

  const aplicarFiltros = () => {
    setFiltros(filtrosTemporarios);
    setModalPesquisaAberto(false);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      status: "todos",
      tipo: "todos",
      base: "todas"
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

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (user: UserWithBaseInfo) => {
    return <StatusBadge isActive={!user.authDisabled} activeText="Ativo" inactiveText="Desabilitado" />;
  };

  const getTipoBadge = (user: UserWithBaseInfo) => {
    if (user.isAdmin) {
      return <Badge variant="secondary">Administrador</Badge>;
    }
    return <Badge variant="outline">Usuário</Badge>;
  };

  const getBasesText = (user: UserWithBaseInfo) => {
    if (user.associatedBases.length === 0) return 'Nenhuma';
    if (user.associatedBases.length === 1) return user.associatedBases[0].name;
    return `${user.associatedBases.length} bases`;
  };

  // Filtros aplicados
  const usuariosFiltrados = useMemo(() => {
    let filtered = usuarios;

    // Filtro por busca
    if (busca.trim()) {
      const searchLower = busca.toLowerCase();
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.associatedBases.some(base => 
          base.name.toLowerCase().includes(searchLower) ||
          base.numberId.toString().includes(searchLower)
        )
      );
    }

    // Filtro por status
    if (filtros.status !== "todos") {
      filtered = filtered.filter(user => {
        if (filtros.status === "ativo") return !user.authDisabled;
        if (filtros.status === "inativo") return user.authDisabled;
        return true;
      });
    }

    // Filtro por tipo
    if (filtros.tipo !== "todos") {
      filtered = filtered.filter(user => {
        if (filtros.tipo === "admin") return user.isAdmin;
        if (filtros.tipo === "usuario") return !user.isAdmin;
        return true;
      });
    }

    // Filtro por base
    if (filtros.base !== "todas") {
      const baseId = filtros.base;
      filtered = filtered.filter(user => 
        user.associatedBases.some(base => base.id === baseId)
      );
    }

    return filtered;
  }, [usuarios, busca, filtros]);

  // Hook para ordenação
  const { sortedData: usuariosOrdenados, sortConfig, handleSort } = useTableSort(usuariosFiltrados, 'displayName');

  const temFiltrosAtivos = busca.trim() || 
    filtros.status !== "todos" || 
    filtros.tipo !== "todos" || 
    filtros.base !== "todas";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[90%] mx-auto p-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Gerenciar Usuários Globais
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button 
                onClick={navegarParaNovo} 
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Seção de Busca */}
          <div className="mb-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou base..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            
            <Dialog open={modalPesquisaAberto} onOpenChange={setModalPesquisaAberto}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`px-4 ${temFiltrosAtivos ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700' : 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white'}`}
                  title="Pesquisa Avançada"
                  onClick={() => setModalPesquisaAberto(true)}
                >
                  <Filter className="h-4 w-4" />
                  <span className="ml-2">Filtros</span>
                  {temFiltrosAtivos && (
                    <span className="ml-2 bg-white text-gray-800 text-xs px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* Tabela */}
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <SortableTableHeader sortKey="displayName" currentSort={sortConfig} onSort={handleSort}>
                  Nome
                </SortableTableHeader>
                <SortableTableHeader sortKey="email" currentSort={sortConfig} onSort={handleSort}>
                  Email
                </SortableTableHeader>
                <SortableTableHeader sortKey="isAdmin" currentSort={sortConfig} onSort={handleSort} align="center">
                  Tipo
                </SortableTableHeader>
                <SortableTableHeader sortKey="authDisabled" currentSort={sortConfig} onSort={handleSort} align="center">
                  Status
                </SortableTableHeader>
                <SortableTableHeader sortKey="associatedBases.length" currentSort={sortConfig} onSort={handleSort}>
                  Bases Associadas
                </SortableTableHeader>
                <SortableTableHeader sortKey="createdAt" currentSort={sortConfig} onSort={handleSort}>
                  Criado em
                </SortableTableHeader>
                <DataTableHeaderCell align="center">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {usuariosOrdenados.map((user) => (
                <DataTableRow key={user.uid} onClick={() => navegarParaEditar(user.uid)}>
                  <DataTableCell className="font-medium">
                    {user.displayName || 'Sem nome'}
                  </DataTableCell>
                  <DataTableCell>{user.email || 'Sem email'}</DataTableCell>
                  <DataTableCell align="center">
                    {getTipoBadge(user)}
                  </DataTableCell>
                  <DataTableCell align="center">
                    {getStatusBadge(user)}
                  </DataTableCell>
                  <DataTableCell>{getBasesText(user)}</DataTableCell>
                  <DataTableCell>{formatDate(user.createdAt || 0)}</DataTableCell>
                  <DataTableCell align="center">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButton
                        type="edit"
                        onClick={() => navegarParaEditar(user.uid)}
                        tooltip="Editar usuário"
                      />
                      <ActionButton
                        type="delete"
                        onClick={() => console.log('Deletar usuário:', user.uid)}
                        tooltip="Deletar usuário"
                      />
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
          
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{usuariosOrdenados.length}</strong> registro(s)
            {temFiltrosAtivos && (
              <span className="ml-2 text-gray-500">
                (filtrado de {usuarios.length} registros)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pesquisa */}
      <Dialog open={modalPesquisaAberto} onOpenChange={setModalPesquisaAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros de Pesquisa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filtro-status">Status</Label>
              <Select
                value={filtrosTemporarios.status}
                onValueChange={(value) => handleFiltroChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-tipo">Tipo de Usuário</Label>
              <Select
                value={filtrosTemporarios.tipo}
                onValueChange={(value) => handleFiltroChange("tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-base">Base</Label>
              <Select
                value={filtrosTemporarios.base}
                onValueChange={(value) => handleFiltroChange("base", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as bases</SelectItem>
                  {clientBases.map((base) => (
                    <SelectItem key={base.id} value={base.id}>
                      #{base.numberId} - {base.name}
                    </SelectItem>
                  ))}
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
    </div>
  );
};

export default GerenciarUsuariosGlobalPage;
