import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, MoreVertical, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionButtons } from "@/components/ui/action-buttons";
import { BaseActionButtons } from "@/components/ui/base-action-buttons";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTableHeaderCell } from "@/components/ui/data-table";
import { db } from "@/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { ClientBase } from "@/types/store";
import { onValue, ref } from "firebase/database";

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

export const GestaoBasesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [clientBases, setClientBases] = useState<ClientBase[]>([]);
  const [baseCreatorsMap, setBaseCreatorsMap] = useState<{
    [uid: string]: string;
  }>({});

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

  // Carregamento dos criadores das bases
  useEffect(() => {
    const adminUsersRef = ref(db, "users");
    const unsubscribe = onValue(adminUsersRef, (snapshot) => {
      const data = snapshot.val();
      const usersArray: AppUser[] = data
        ? Object.keys(data)
            .filter((key) => data[key].profile?.isAdmin === true)
            .map((key) => ({
              uid: key,
              displayName: data[key].profile?.displayName || null,
              email: data[key].profile?.email || null,
              isAdmin: true,
            }))
        : [];

      const creatorsMap: { [uid: string]: string } = {};
      usersArray.forEach((user) => {
        creatorsMap[user.uid] = user.displayName || user.email || user.uid;
      });
      setBaseCreatorsMap(creatorsMap);
    });
    return () => unsubscribe();
  }, []);

  const basesFiltradas = useMemo(() => {
    let resultado = clientBases;
    
    const termo = busca.trim().toLowerCase();
    if (termo) {
      resultado = resultado.filter((base) => {
        return (
          (base.name && base.name.toLowerCase().includes(termo)) ||
          (base.cnpj && base.cnpj.replace(/\D/g, "").includes(termo.replace(/\D/g, ""))) ||
          (base.numberId && base.numberId.toString().includes(termo))
        );
      });
    }
    
    if (filtros.status !== "todos") {
      if (filtros.status === "ativo") {
        resultado = resultado.filter(base => base.ativo);
      } else if (filtros.status === "inativo") {
        resultado = resultado.filter(base => !base.ativo);
      }
    }
    
    return resultado;
  }, [busca, clientBases, filtros]);

  const navegarParaNovoCadastro = () => {
    navigate("/admin/gestao-bases/nova");
  };

  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/admin/gestao-bases/editar/${idRegistro}`);
  };

  const navegarParaVisualizarBase = (idRegistro: string) => {
    navigate(`/admin/gestao-bases/editar/${idRegistro}`);
  };

  const navegarParaContrato = (idRegistro: string) => {
    navigate(`/admin/gestao-bases/contrato/${idRegistro}`);
  };

  const lidarComDelecao = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      // Implementar lógica de deleção quando necessário
      console.log(`Deletar base: ${id}`);
    }
  };

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

  const abrirModalPesquisa = () => {
    setFiltrosTemporarios(filtros);
    setModalPesquisaAberto(true);
  };

  const temFiltrosAtivos = filtros.status !== "todos" || filtros.tipo !== "todos";

  const exportarCSV = () => {
    const cabecalhos = [
      "ID",
      "Nome",
      "CNPJ",
      "Status",
      "Usuários",
      "Limite Acesso",
      "Criado Por",
      "Data Criação"
    ];

    const linhasCSV = basesFiltradas.map(base => {
      return [
        `"${base.numberId || ""}"`,
        `"${base.name || ""}"`,
        `"${base.cnpj || ""}"`,
        `"${base.ativo ? 'Ativo' : 'Inativo'}"`,
        `"${base.authorizedUIDs ? Object.keys(base.authorizedUIDs).length : 0}"`,
        `"${base.limite_acesso || 'Ilimitado'}"`,
        `"${baseCreatorsMap[base.createdBy] || base.createdBy || ""}"`,
        `"${base.createdAt ? new Date(base.createdAt).toLocaleDateString('pt-BR') : ""}"`
      ].join(",");
    });

    const csvContent = [cabecalhos.join(","), ...linhasCSV].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `bases-${dataAtual}.csv`;
    link.setAttribute("download", nomeArquivo);
    
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getUserCount = (base: ClientBase) => {
    if (!base.authorizedUIDs) return 0;
    return Object.keys(base.authorizedUIDs).length;
  };
  return (
    <div className="w-full px-4 py-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Gestão de Bases
            </CardTitle>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:border-gray-700"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportarCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar registros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                onClick={navegarParaNovoCadastro} 
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Base
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
                placeholder="Buscar por nome, CNPJ ou ID..."
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
                  onClick={abrirModalPesquisa}
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Pesquisa Avançada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Filtro por Status */}
                  <div>
                    <Label htmlFor="filtroStatus">Status</Label>
                    <Select 
                      value={filtrosTemporarios.status} 
                      onValueChange={(value) => handleFiltroChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Apenas Ativos</SelectItem>
                        <SelectItem value="inativo">Apenas Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button"
                      onClick={aplicarFiltros}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      Aplicar
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={limparFiltros}
                      className="flex-1 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {temFiltrosAtivos && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filtros.status !== "todos" && (
                <Badge variant="secondary" className="bg-gray-800 text-white">
                  Status: {filtros.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              )}
            </div>
          )}

          {/* Tabela */}
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHeaderCell>ID</DataTableHeaderCell>
                <DataTableHeaderCell>Nome da Base</DataTableHeaderCell>
                <DataTableHeaderCell>CNPJ</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Usuários</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Limite</DataTableHeaderCell>
                <DataTableHeaderCell>Criado em</DataTableHeaderCell>
                <DataTableHeaderCell>Criado por</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Status</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {basesFiltradas.length === 0 && (
                <DataTableRow>
                  <DataTableCell className="py-8 text-gray-500" align="center" colSpan={9}>
                    {clientBases.length === 0 ? 'Nenhuma base cadastrada ainda.' : 'Nenhuma base encontrada com os filtros aplicados.'}
                  </DataTableCell>
                </DataTableRow>
              )}
              {basesFiltradas.length > 0 && basesFiltradas
                .sort((a, b) => (a.numberId || 0) - (b.numberId || 0))
                .map((base) => (
                <DataTableRow key={base.id} onClick={() => navegarParaVisualizarBase(base.id)} className={!base.ativo ? 'opacity-60' : ''}>
                  <DataTableCell className="font-medium">#{base.numberId || 'N/A'}</DataTableCell>
                  <DataTableCell className="font-medium">{base.name}</DataTableCell>
                  <DataTableCell>{base.cnpj || 'Não informado'}</DataTableCell>
                  <DataTableCell align="center">{getUserCount(base)}</DataTableCell>
                  <DataTableCell align="center">
                    {base.limite_acesso ? base.limite_acesso : 'Ilimitado'}
                  </DataTableCell>
                  <DataTableCell>{formatDate(base.createdAt)}</DataTableCell>
                  <DataTableCell>
                    <span className="truncate max-w-32">
                      {baseCreatorsMap[base.createdBy] || base.createdBy || 'N/A'}
                    </span>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <StatusBadge isActive={base.ativo} />
                  </DataTableCell>
                  <DataTableCell align="center">
                    <BaseActionButtons
                      onEdit={() => navegarParaEditar(base.id)}
                      onContract={() => navegarParaContrato(base.id)}
                      onDelete={() => lidarComDelecao(base.id, base.name)}
                    />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
          
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{basesFiltradas.length}</strong> registro(s)
            {temFiltrosAtivos && (
              <span className="ml-2 text-gray-800 font-medium">
                (filtrado de {clientBases.length} registros)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
