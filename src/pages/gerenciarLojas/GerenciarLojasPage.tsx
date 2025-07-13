import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStores } from "@/hooks/useStores";
import { Store } from "@/types/store.tsx"; 
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit2, Trash2, Search, Filter, MoreVertical, Download, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { maskCNPJ } from "@/utils/formatters";

export const GerenciarLojasPage: React.FC = () => {
  const {
    stores,
    deleteStore
  } = useStores();

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
    navigate("/gerenciar-lojas/novo");
  };

  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/gerenciar-lojas/editar/${idRegistro}`);
  };

  const navegarParaVisualizarLoja = (idRegistro: string) => {
    navigate(`/gerenciar-lojas/editar/${idRegistro}`);
  };

  const lidarComDelecao = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      await deleteStore(id);
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
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Lojas</h1>
          <p className="text-gray-800 mt-1">
            {lojasFiltradas.length} de {stores.length} lojas
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={exportarCSV}
            variant="outline"
            className="flex items-center gap-2 text-gray-800 border-gray-800 hover:bg-gray-800 hover:text-white"
          >
            <Download size={16} />
            Exportar CSV
          </Button>
          
          <Button
            onClick={navegarParaNovoCadastro}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white"
          >
            <PlusCircle size={16} />
            Nova Loja
          </Button>
        </div>
      </div>

      <Card className="border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CNPJ, apelido ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 border-gray-800 focus:ring-gray-800 focus:border-gray-800"
              />
            </div>
            
            <Dialog open={modalPesquisaAberto} onOpenChange={setModalPesquisaAberto}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={abrirModalPesquisa}
                  className={`flex items-center gap-2 min-w-fit border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white ${
                    temFiltrosAtivos ? 'bg-gray-800 text-white' : ''
                  }`}
                >
                  <Filter size={16} />
                  Filtros
                  {temFiltrosAtivos && (
                    <Badge variant="secondary" className="ml-1 bg-white text-gray-800">
                      Ativo
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-800">Filtros Avançados</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-gray-800">Status da Loja</Label>
                    <Select
                      value={filtrosTemporarios.status}
                      onValueChange={(value) => handleFiltroChange('status', value)}
                    >
                      <SelectTrigger className="border-gray-800 focus:ring-gray-800">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="matriz">Matriz</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                        <SelectItem value="padrao">Loja Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={limparFiltros}
                    className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    onClick={aplicarFiltros}
                    className="bg-gray-800 hover:bg-gray-700 text-white"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {lojasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-800 text-lg mb-4">
                {stores.length === 0 ? 'Nenhuma loja cadastrada ainda.' : 'Nenhuma loja encontrada com os filtros aplicados.'}
              </p>
              {stores.length === 0 && (
                <Button
                  onClick={navegarParaNovoCadastro}
                  className="bg-gray-800 hover:bg-gray-700 text-white"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Cadastrar Primeira Loja
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {lojasFiltradas.map((loja) => (
                <div
                  key={loja.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navegarParaVisualizarLoja(loja.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {loja.icon &&
                      (loja.icon.startsWith("data:image") ||
                        loja.icon.startsWith("http")) ? (
                        <img
                          src={loja.icon}
                          alt={loja.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                          {loja.icon || "🏪"}
                        </span>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {loja.name}
                          </h3>
                          
                          {loja.isMatriz && (
                            <Badge className="bg-gray-800 text-white">
                              Matriz
                            </Badge>
                          )}
                          
                          {loja.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                          
                          {loja.nickname && (
                            <Badge variant="secondary" className="text-xs">
                              {loja.nickname}
                            </Badge>
                          )}
                          
                          {loja.code && (
                            <Badge variant="outline" className="text-xs">
                              #{loja.code}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-800">
                          CNPJ: {maskCNPJ(loja.cnpj)}
                        </p>
                        
                        {(loja.telefones?.length || loja.emails?.length || loja.endereco?.cidade) && (
                          <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-800">
                            {loja.telefones?.find(t => t.principal) && (
                              <span>📞 {loja.telefones.find(t => t.principal)!.numero}</span>
                            )}
                            {loja.emails?.find(e => e.principal) && (
                              <span>✉️ {loja.emails.find(e => e.principal)!.email}</span>
                            )}
                            {loja.endereco?.cidade && (
                              <span>📍 {loja.endereco.cidade}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-800 hover:bg-gray-800 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-gray-800">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navegarParaEditar(loja.id);
                          }}
                          className="text-gray-800 focus:bg-gray-800 focus:text-white"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            lidarComDelecao(loja.id, loja.name);
                          }}
                          className="text-red-600 focus:bg-red-600 focus:text-white"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
