import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStores } from "@/hooks/useStores";
import { Store } from "@/types/store"; 
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, MoreVertical, Download, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { maskCNPJ } from "@/utils/formatters";
import { ActionButtons } from "@/components/ui/action-buttons";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTableHeaderCell } from "@/components/ui/data-table";

const LojaPage: React.FC = () => {
  const {
    stores,
    deleteStore,
    updateStore
  } = useStores();

  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  
  const [modalPesquisaAberto, setModalPesquisaAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [lojaParaExcluir, setLojaParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  
  const [filtros, setFiltros] = useState({
    status: "todos",
    tipo: "todos"
  });
  const [filtrosTemporarios, setFiltrosTemporarios] = useState({
    status: "todos",
    tipo: "todos"
  });

  const lojasFiltradas = useMemo(() => {
    let resultado = stores;
    
    const termo = busca.trim().toLowerCase();
    if (termo) {
      resultado = resultado.filter((loja) => {
        return (
          (loja.name && loja.name.toLowerCase().includes(termo)) ||
          (loja.nickname && loja.nickname.toLowerCase().includes(termo)) ||
          (loja.code && loja.code.toLowerCase().includes(termo)) ||
          (loja.cnpj && loja.cnpj.replace(/\D/g, "").includes(termo.replace(/\D/g, "")))
        );
      });
    }
    
    if (filtros.status !== "todos") {
      if (filtros.status === "matriz") {
        resultado = resultado.filter(loja => loja.isMatriz);
      } else if (filtros.status === "filial") {
        resultado = resultado.filter(loja => !loja.isMatriz);
      } else if (filtros.status === "padrao") {
        resultado = resultado.filter(loja => loja.isDefault);
      }
    }
    
    return resultado;
  }, [busca, stores, filtros]);
  
  const navigate = useNavigate();

  const navegarParaNovoCadastro = () => {
    navigate("/loja/criar-loja");
  };

  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/loja/editar-loja/${idRegistro}`);
  };

  const lidarComDelecao = (id: string, nome: string) => {
    setLojaParaExcluir({ id, nome });
    setModalConfirmacaoAberto(true);
  };

  const confirmarDelecao = async () => {
    if (!lojaParaExcluir) return;

    try {
      await deleteStore(lojaParaExcluir.id);
      toast({
        title: "Sucesso!",
        description: `Loja "${lojaParaExcluir.nome}" foi removida com sucesso.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover a loja. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setModalConfirmacaoAberto(false);
      setLojaParaExcluir(null);
    }
  };

  const cancelarDelecao = () => {
    setModalConfirmacaoAberto(false);
    setLojaParaExcluir(null);
  };

  const handleToggleDefault = (storeId: string) => {
    const currentStore = stores.find((s) => s.id === storeId);
    if (!currentStore) return;

    const newIsDefault = !currentStore.isDefault;

    // Se está marcando como padrão, desmarca qualquer outra que seja padrão
    if (newIsDefault) {
      stores.forEach((s) => {
        if (s.isDefault && s.id !== storeId) {
          updateStore(s.id, { ...s, isDefault: false });
        }
      });
    }
    updateStore(storeId, { ...currentStore, isDefault: newIsDefault });
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
      "Nome",
      "CNPJ",
      "Apelido",
      "Código",
      "Tipo",
      "Telefone",
      "Email",
      "Endereço",
      "Cidade",
      "Status"
    ];

    const linhasCSV = lojasFiltradas.map(loja => {
      const telefonePrincipal = loja.telefones?.find(t => t.principal) || loja.telefones?.[0];
      const emailPrincipal = loja.emails?.find(e => e.principal) || loja.emails?.[0];
      
      return [
        `"${loja.name || ""}"`,
        `"${loja.cnpj || ""}"`,
        `"${loja.nickname || ""}"`,
        `"${loja.code || ""}"`,
        `"${loja.isMatriz ? 'Matriz' : 'Filial'}"`,
        `"${telefonePrincipal?.numero || ""}"`,
        `"${emailPrincipal?.email || ""}"`,
        `"${loja.endereco?.logradouro ? `${loja.endereco.logradouro}, ${loja.endereco.numero || 'S/N'}` : ""}"`,
        `"${loja.endereco?.cidade || ""}"`,
        `"${loja.isDefault ? 'Padrão' : 'Normal'}"`
      ].join(',');
    });

    const csvContent = [cabecalhos.join(','), ...linhasCSV].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lojas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída!",
        description: `${lojasFiltradas.length} registros exportados com sucesso.`,
        variant: "success",
      });
    }
  };

  return (
    <div className="w-[90%] mx-auto p-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Gerenciar Lojas
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
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pesquisa Avançada</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filtroStatus">Status da Loja</Label>
                    <Select 
                      value={filtrosTemporarios.status} 
                      onValueChange={(value) => handleFiltroChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="matriz">Matriz</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                        <SelectItem value="padrao">Loja Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button"
                      onClick={aplicarFiltros}
                      className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-white"
                    >
                      Aplicar
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={limparFiltros}
                      className="flex-1 border-[#1f2937] text-[#1f2937] hover:bg-[#1f2937] hover:text-white"
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
                <Badge variant="secondary" className="bg-[#1f2937] text-white">
                  Status: {filtros.status === "matriz" ? "Matriz" : filtros.status === "filial" ? "Filial" : "Loja Padrão"}
                </Badge>
              )}
            </div>
          )}
          {/* Tabela de Resultados */}
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHeaderCell>Nome/Razão Social</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Tipo</DataTableHeaderCell>
                <DataTableHeaderCell align="center">CNPJ</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Telefone</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Email</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Matriz</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Status</DataTableHeaderCell>
                <DataTableHeaderCell align="center">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {lojasFiltradas.length === 0 && (
                <DataTableRow>
                  <DataTableCell className="py-8 text-gray-500" align="center" colSpan={8}>
                    {stores.length === 0 ? 'Nenhuma loja cadastrada ainda.' : 'Nenhuma loja encontrada com os filtros aplicados.'}
                  </DataTableCell>
                </DataTableRow>
              )}
              {lojasFiltradas.length > 0 && lojasFiltradas.map((loja) => {
                const telefonePrincipal = loja.telefones?.find(t => t.principal) || loja.telefones?.[0];
                const emailPrincipal = loja.emails?.find(e => e.principal) || loja.emails?.[0];
                
                return (
                  <DataTableRow key={loja.id} onClick={() => navegarParaEditar(loja.id)}>
                    <DataTableCell>
                      <div className="flex items-center gap-2">
                        {loja.icon &&
                        (loja.icon.startsWith("data:image") ||
                          loja.icon.startsWith("http")) ? (
                          <img
                            src={loja.icon}
                            alt={loja.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                            {loja.icon || "🏪"}
                          </span>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {loja.name}
                            {loja.isDefault && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          {(loja.nickname || loja.code) && (
                            <div className="flex gap-1 mt-1">
                              {loja.nickname && (
                                <span className="text-xs bg-gray-200 text-gray-700 px-1 py-0.5 rounded">
                                  {loja.nickname}
                                </span>
                              )}
                              {loja.code && (
                                <span className="text-xs bg-gray-800 text-white px-1 py-0.5 rounded">
                                  #{loja.code}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell align="center">
                      {loja.isMatriz ? "Matriz" : "Filial"}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {maskCNPJ(loja.cnpj)}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {telefonePrincipal ? (
                        <div className="flex items-center gap-1">
                          <span>{telefonePrincipal.numero}</span>
                          {telefonePrincipal.principal && (
                            <span className="text-xs bg-gray-800 text-white px-1 py-0.5 rounded">P</span>
                          )}
                        </div>
                      ) : "-"}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {emailPrincipal ? (
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-32">{emailPrincipal.email}</span>
                          {emailPrincipal.principal && (
                            <span className="text-xs bg-gray-800 text-white px-1 py-0.5 rounded">P</span>
                          )}
                        </div>
                      ) : "-"}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {loja.isMatriz ? (
                        <span className="font-medium">Sim</span>
                      ) : (
                        <span className="text-gray-500">Não</span>
                      )}
                    </DataTableCell>
                    <DataTableCell align="center">
                      <StatusBadge isActive={loja.ativo !== false} />
                    </DataTableCell>
                    <DataTableCell align="center">
                      <ActionButtons
                        onEdit={() => navegarParaEditar(loja.id)}
                        onDelete={() => lidarComDelecao(loja.id, loja.name)}
                      />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={modalConfirmacaoAberto} onOpenChange={setModalConfirmacaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja remover a loja <strong>"{lojaParaExcluir?.nome}"</strong>?
            </p>
            <p className="text-red-600 text-sm mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelarDelecao}
              className="border-[#1f2937] text-[#1f2937] hover:bg-[#1f2937] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarDelecao}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LojaPage;
