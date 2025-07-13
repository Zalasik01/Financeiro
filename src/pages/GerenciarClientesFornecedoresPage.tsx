import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientesFornecedores } from "@/hooks/useClientesFornecedores";
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"; 
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, MoreVertical, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ActionButtons } from "@/components/ui/action-buttons";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTableHeaderCell } from "@/components/ui/data-table";

export const GerenciarClientesFornecedoresPage: React.FC = () => {
  const {
    clientesFornecedores,
    carregando,
    deletarClienteFornecedor
  } = useClientesFornecedores();

  const [busca, setBusca] = useState("");
  
  const [modalPesquisaAberto, setModalPesquisaAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    ativo: "todos",
    perfil: "todos",
    tipo: "todos"
  });
  const [filtrosTemporarios, setFiltrosTemporarios] = useState({
    ativo: "todos",
    perfil: "todos",
    tipo: "todos"
  });

  const clientesFiltrados = useMemo(() => {
    let resultado = clientesFornecedores;
    
    const termo = busca.trim().toLowerCase();
    if (termo) {
      resultado = resultado.filter((cf) => {
        return (
          (cf.nome && cf.nome.toLowerCase().includes(termo)) ||
          (cf.numeroDocumento && cf.numeroDocumento.replace(/\D/g, "").includes(termo.replace(/\D/g, "")))
        );
      });
    }
    
    if (filtros.ativo !== "todos") {
      const isAtivo = filtros.ativo === "ativo";
      resultado = resultado.filter(cf => cf.ativo === isAtivo);
    }
    
    if (filtros.perfil !== "todos") {
      if (filtros.perfil === "cliente") {
        resultado = resultado.filter(cf => cf.ehCliente);
      } else if (filtros.perfil === "fornecedor") {
        resultado = resultado.filter(cf => cf.ehFornecedor);
      }
    }
    
    if (filtros.tipo !== "todos") {
      if (filtros.tipo === "fisica") {
        resultado = resultado.filter(cf => cf.tipoDocumento === "CPF");
      } else if (filtros.tipo === "juridica") {
        resultado = resultado.filter(cf => cf.tipoDocumento === "CNPJ");
      }
    }
    
    return resultado;
  }, [busca, clientesFornecedores, filtros]);
  
  const navigate = useNavigate();

  const navegarParaNovoCadastro = () => {
    navigate("/clientes-fornecedores/novo");
  };

  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  const navegarParaVisualizarCliente = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  const lidarComDelecao = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      await deletarClienteFornecedor(id, nome);
    }
  };

  const aplicarFiltros = () => {
    setFiltros(filtrosTemporarios);
    setModalPesquisaAberto(false);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      ativo: "todos",
      perfil: "todos",
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

  const temFiltrosAtivos = filtros.ativo !== "todos" || filtros.perfil !== "todos" || filtros.tipo !== "todos";

  const exportarCSV = () => {
    const cabecalhos = [
      "Nome/Razão Social",
      "Tipo",
      "Documento",
      "Número Documento",
      "Telefone",
      "Email", 
      "Cliente",
      "Fornecedor",
      "Status"
    ];

    const linhasCSV = clientesFiltrados.map(cf => {
      const telefonePrincipal = cf.telefones?.find(t => t.principal) || cf.telefones?.[0];
      const emailPrincipal = cf.emails?.find(e => e.principal) || cf.emails?.[0];
      
      return [
        `"${cf.nome || ""}"`,
        `"${cf.tipoDocumento === 'CNPJ' ? 'Jurídica' : 'Física'}"`,
        `"${cf.tipoDocumento || ""}"`,
        `"${cf.numeroDocumento || ""}"`,
        `"${telefonePrincipal?.numero || cf.telefone || ""}"`,
        `"${emailPrincipal?.email || cf.email || ""}"`,
        `"${cf.ehCliente ? 'Sim' : 'Não'}"`,
        `"${cf.ehFornecedor ? 'Sim' : 'Não'}"`,
        `"${cf.ativo === false ? 'Inativo' : 'Ativo'}"`
      ].join(",");
    });

    const csvContent = [cabecalhos.join(","), ...linhasCSV].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `clientes-fornecedores-${dataAtual}.csv`;
    link.setAttribute("download", nomeArquivo);
    
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-[90%] mx-auto p-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Gerenciar Clientes e Fornecedores
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
                Novo Cadastro
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
                placeholder="Buscar por nome ou documento..."
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
                    <Label htmlFor="filtroAtivo">Status</Label>
                    <Select 
                      value={filtrosTemporarios.ativo} 
                      onValueChange={(value) => handleFiltroChange("ativo", value)}
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

                  {/* Filtro por Perfil */}
                  <div>
                    <Label htmlFor="filtroPerfil">Perfil</Label>
                    <Select 
                      value={filtrosTemporarios.perfil} 
                      onValueChange={(value) => handleFiltroChange("perfil", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="cliente">Apenas Clientes</SelectItem>
                        <SelectItem value="fornecedor">Apenas Fornecedores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Tipo */}
                  <div>
                    <Label htmlFor="filtroTipo">Tipo de Pessoa</Label>
                    <Select 
                      value={filtrosTemporarios.tipo} 
                      onValueChange={(value) => handleFiltroChange("tipo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="fisica">Pessoa Física</SelectItem>
                        <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
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
              {filtros.ativo !== "todos" && (
                <Badge variant="secondary" className="bg-gray-800 text-white">
                  Status: {filtros.ativo === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              )}
              {filtros.perfil !== "todos" && (
                <Badge variant="secondary" className="bg-gray-800 text-white">
                  Perfil: {filtros.perfil === "cliente" ? "Cliente" : "Fornecedor"}
                </Badge>
              )}
              {filtros.tipo !== "todos" && (
                <Badge variant="secondary" className="bg-gray-800 text-white">
                  Tipo: {filtros.tipo === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </Badge>
              )}
            </div>
          )}

          {/* Tabela */}
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHeaderCell>Nome/Razão Social</DataTableHeaderCell>
                <DataTableHeaderCell>Tipo</DataTableHeaderCell>
                <DataTableHeaderCell>Documento</DataTableHeaderCell>
                <DataTableHeaderCell>Telefone</DataTableHeaderCell>
                <DataTableHeaderCell>Email</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Cliente</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Fornecedor</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Status</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {carregando && (
                <DataTableRow>
                  <DataTableCell className="py-8" align="center" colSpan={9}>
                    Carregando cadastros...
                  </DataTableCell>
                </DataTableRow>
              )}
              {!carregando && clientesFiltrados.length === 0 && (
                <DataTableRow>
                  <DataTableCell className="py-8 text-gray-500" align="center" colSpan={9}>
                    Nenhum cliente ou fornecedor encontrado.
                  </DataTableCell>
                </DataTableRow>
              )}
              {!carregando && clientesFiltrados.length > 0 && clientesFiltrados.map((cf) => {
                // Busca telefone principal ou primeiro telefone
                const telefonePrincipal = cf.telefones?.find(t => t.principal) || cf.telefones?.[0];
                const emailPrincipal = cf.emails?.find(e => e.principal) || cf.emails?.[0];
                
                return (
                  <DataTableRow key={cf.id} onClick={() => navegarParaVisualizarCliente(cf.id)} className={cf.ativo === false ? 'opacity-60' : ''}>
                    <DataTableCell className="font-medium">{cf.nome}</DataTableCell>
                    <DataTableCell>{cf.tipoDocumento === 'CNPJ' ? "Jurídica" : "Física"}</DataTableCell>
                    <DataTableCell>
                      {cf.tipoDocumento}: {cf.numeroDocumento || "Não informado"}
                    </DataTableCell>
                    <DataTableCell>
                      {telefonePrincipal ? (
                        <div className="flex items-center gap-1">
                          <span>{telefonePrincipal.numero}</span>
                          {telefonePrincipal.principal && (
                            <span className="text-xs bg-gray-800 text-white px-1 py-0.5 rounded">P</span>
                          )}
                        </div>
                      ) : (cf.telefone || "-")}
                    </DataTableCell>
                    <DataTableCell>
                      {emailPrincipal ? (
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-32">{emailPrincipal.email}</span>
                          {emailPrincipal.principal && (
                            <span className="text-xs bg-gray-800 text-white px-1 py-0.5 rounded">P</span>
                          )}
                        </div>
                      ) : (cf.email || "-")}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {cf.ehCliente ? "Sim" : "Não"}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {cf.ehFornecedor ? "Sim" : "Não"}
                    </DataTableCell>
                    <DataTableCell align="center">
                      <StatusBadge isActive={cf.ativo} />
                    </DataTableCell>
                    <DataTableCell align="center">
                      <ActionButtons
                        onEdit={() => navegarParaEditar(cf.id)}
                        onDelete={() => lidarComDelecao(cf.id, cf.nome)}
                      />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
          
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{clientesFiltrados.length}</strong> registro(s)
            {temFiltrosAtivos && (
              <span className="ml-2 text-gray-800 font-medium">
                (filtrado de {clientesFornecedores.length} registros)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};