import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientesFornecedores } from "@/hooks/useClientesFornecedores";
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"; 
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit2, Trash2, Search, Filter, MoreVertical, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const GerenciarClientesFornecedoresPage: React.FC = () => {
  const {
    clientesFornecedores,
    carregando,
    deletarClienteFornecedor
  } = useClientesFornecedores();

  const [busca, setBusca] = useState("");
  
  // Estados para pesquisa avançada
  const [modalPesquisaAberto, setModalPesquisaAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    ativo: "todos", // "todos", "ativo", "inativo"
    perfil: "todos", // "todos", "cliente", "fornecedor"
    tipo: "todos" // "todos", "fisica", "juridica"
  });

  const clientesFiltrados = useMemo(() => {
    let resultado = clientesFornecedores;
    
    // Filtro por texto de busca
    const termo = busca.trim().toLowerCase();
    if (termo) {
      resultado = resultado.filter((cf) => {
        return (
          (cf.nome && cf.nome.toLowerCase().includes(termo)) ||
          (cf.numeroDocumento && cf.numeroDocumento.replace(/\D/g, "").includes(termo.replace(/\D/g, "")))
        );
      });
    }
    
    // Filtros avançados
    // Filtro por status ativo/inativo
    if (filtros.ativo !== "todos") {
      const isAtivo = filtros.ativo === "ativo";
      resultado = resultado.filter(cf => cf.ativo === isAtivo);
    }
    
    // Filtro por perfil (cliente/fornecedor)
    if (filtros.perfil !== "todos") {
      if (filtros.perfil === "cliente") {
        resultado = resultado.filter(cf => cf.ehCliente);
      } else if (filtros.perfil === "fornecedor") {
        resultado = resultado.filter(cf => cf.ehFornecedor);
      }
    }
    
    // Filtro por tipo (física/jurídica)
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

  // Abre o modal para um novo cadastro
  const navegarParaNovoCadastro = () => {
    navigate("/clientes-fornecedores/novo");
  };

  // Navega para a página de edição
  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  // Navega para visualizar/editar cliente
  const navegarParaVisualizarCliente = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  // Lida com a exclusão de um registro
  const lidarComDelecao = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      await deletarClienteFornecedor(id, nome);
    }
  };

  // Funções para pesquisa avançada
  const aplicarFiltros = () => {
    setModalPesquisaAberto(false);
  };

  const limparFiltros = () => {
    setFiltros({
      ativo: "todos",
      perfil: "todos",
      tipo: "todos"
    });
    setBusca("");
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Verifica se há filtros ativos
  const temFiltrosAtivos = filtros.ativo !== "todos" || filtros.perfil !== "todos" || filtros.tipo !== "todos";

  // Função para exportar CSV
  const exportarCSV = () => {
    // Cabeçalhos do CSV
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

    // Converter dados para CSV
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

    // Combinar cabeçalhos e dados
    const csvContent = [cabecalhos.join(","), ...linhasCSV].join("\n");

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    // Nome do arquivo com data atual
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
              {/* Menu de Opções */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-[#1a365d] text-white border-[#1a365d] hover:bg-[#2d5a87] hover:border-[#2d5a87]"
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

              {/* Botão Novo Cadastro */}
              <Button 
                onClick={navegarParaNovoCadastro} 
                className="bg-[#1a365d] hover:bg-[#2d5a87] text-white"
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
            
            {/* Botão de Pesquisa Avançada */}
            <Dialog open={modalPesquisaAberto} onOpenChange={setModalPesquisaAberto}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`px-4 ${temFiltrosAtivos ? 'bg-[#1a365d] text-white border-[#1a365d] hover:bg-[#2d5a87]' : 'border-[#1a365d] text-[#1a365d] hover:bg-[#1a365d] hover:text-white'}`}
                  title="Pesquisa Avançada"
                >
                  <Filter className="h-4 w-4" />
                  {temFiltrosAtivos && (
                    <span className="ml-2 bg-white text-[#1a365d] text-xs px-2 py-0.5 rounded-full">
                      Filtros
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
                      value={filtros.ativo} 
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
                      value={filtros.perfil} 
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
                      value={filtros.tipo} 
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

                  {/* Botões */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button"
                      onClick={aplicarFiltros}
                      className="flex-1 bg-[#1a365d] hover:bg-[#2d5a87] text-white"
                    >
                      Aplicar
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={limparFiltros}
                      className="flex-1 border-[#1a365d] text-[#1a365d] hover:bg-[#1a365d] hover:text-white"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Indicadores de Filtros Ativos */}
          {temFiltrosAtivos && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filtros.ativo !== "todos" && (
                <Badge variant="secondary" className="bg-[#1a365d] text-white">
                  Status: {filtros.ativo === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              )}
              {filtros.perfil !== "todos" && (
                <Badge variant="secondary" className="bg-[#1a365d] text-white">
                  Perfil: {filtros.perfil === "cliente" ? "Cliente" : "Fornecedor"}
                </Badge>
              )}
              {filtros.tipo !== "todos" && (
                <Badge variant="secondary" className="bg-[#1a365d] text-white">
                  Tipo: {filtros.tipo === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </Badge>
              )}
            </div>
          )}

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Nome/Razão Social</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tipo</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Documento</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Telefone</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Cliente</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Fornecedor</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center">
                      Carregando cadastros...
                    </td>
                  </tr>
                )}
                {!carregando && clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      Nenhum cliente ou fornecedor encontrado.
                    </td>
                  </tr>
                )}
                {!carregando && clientesFiltrados.length > 0 && clientesFiltrados.map((cf) => {
                  // Busca telefone principal ou primeiro telefone
                  const telefonePrincipal = cf.telefones?.find(t => t.principal) || cf.telefones?.[0];
                  const emailPrincipal = cf.emails?.find(e => e.principal) || cf.emails?.[0];
                  
                  return (
                    <tr key={cf.id} className={`hover:bg-gray-50 cursor-pointer ${cf.ativo === false ? 'opacity-60' : ''}`} onClick={() => navegarParaVisualizarCliente(cf.id)}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{cf.nome}</td>
                      <td className="border border-gray-300 px-4 py-2">{cf.tipoDocumento === 'CNPJ' ? "Jurídica" : "Física"}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {cf.tipoDocumento}: {cf.numeroDocumento || "Não informado"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {telefonePrincipal ? (
                          <div className="flex items-center gap-1">
                            <span>{telefonePrincipal.numero}</span>
                            {telefonePrincipal.principal && (
                              <span className="text-xs bg-[#1a365d] text-white px-1 py-0.5 rounded">P</span>
                            )}
                          </div>
                        ) : (cf.telefone || "-")}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {emailPrincipal ? (
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-32">{emailPrincipal.email}</span>
                            {emailPrincipal.principal && (
                              <span className="text-xs bg-[#1a365d] text-white px-1 py-0.5 rounded">P</span>
                            )}
                          </div>
                        ) : (cf.email || "-")}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {cf.ehCliente ? "Sim" : "Não"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {cf.ehFornecedor ? "Sim" : "Não"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {cf.ativo === false ? (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700 border border-red-300">Inativo</span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700 border border-green-300">Ativo</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navegarParaEditar(cf.id);
                            }} 
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700" 
                            onClick={(e) => {
                              e.stopPropagation();
                              lidarComDelecao(cf.id, cf.nome);
                            }} 
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{clientesFiltrados.length}</strong> registro(s)
            {temFiltrosAtivos && (
              <span className="ml-2 text-[#1a365d] font-medium">
                (filtrado de {clientesFornecedores.length} registros)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};