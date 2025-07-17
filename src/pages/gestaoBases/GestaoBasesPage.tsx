import { ActionButton } from "@/components/ui/ActionButton";
import { SortableTableHeader } from "@/components/ui/SortableTableHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTableSort } from "@/hooks/useTableSort";
import type { ClientBase } from "@/types/store";
import { maskCNPJ } from "@/utils/formatters";
import { onValue, ref, update } from "firebase/database";
import {
  Ban,
  Download,
  FileText,
  Filter,
  MoreVertical,
  PlusCircle,
  Search,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

export const GestaoBasesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clientBases, setClientBases] = useState<ClientBase[]>([]);
  const [baseCreatorsMap, setBaseCreatorsMap] = useState<{
    [uid: string]: string;
  }>({});

  const [busca, setBusca] = useState("");

  const [modalPesquisaAberto, setModalPesquisaAberto] = useState(false);
  const [modalInativacaoAberto, setModalInativacaoAberto] = useState(false);
  const [baseParaInativar, setBaseParaInativar] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [motivoInativacao, setMotivoInativacao] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [usarMotivoPersonalizado, setUsarMotivoPersonalizado] = useState(false);
  const [filtros, setFiltros] = useState({
    status: "todos",
    tipo: "todos",
  });
  const [filtrosTemporarios, setFiltrosTemporarios] = useState({
    status: "todos",
    tipo: "todos",
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
          (base.cnpj &&
            base.cnpj.replace(/\D/g, "").includes(termo.replace(/\D/g, ""))) ||
          (base.numberId && base.numberId.toString().includes(termo))
        );
      });
    }

    if (filtros.status !== "todos") {
      if (filtros.status === "ativo") {
        resultado = resultado.filter((base) => base.ativo);
      } else if (filtros.status === "inativo") {
        resultado = resultado.filter((base) => !base.ativo);
      }
    }

    return resultado;
  }, [busca, clientBases, filtros]);

  const {
    sortConfig,
    handleSort,
    sortedData: basesOrdenadas,
  } = useTableSort(basesFiltradas, { key: "name", direction: "asc" });

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

  const abrirModalInativacao = (id: string, nome: string) => {
    setBaseParaInativar({ id, nome });
    setModalInativacaoAberto(true);
  };

  const lidarComInativacao = async () => {
    if (!baseParaInativar) return;

    let motivoFinal = "";
    if (usarMotivoPersonalizado) {
      const motivoLimpo = motivoPersonalizado.replace(/\s/g, "");
      if (motivoLimpo.length < 5) {
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            "O motivo personalizado deve ter no mínimo 5 caracteres (sem contar espaços).",
        });
        return;
      }
      motivoFinal = motivoPersonalizado;
    } else {
      if (!motivoInativacao) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Por favor, selecione um motivo para a inativação.",
        });
        return;
      }
      motivoFinal = motivoInativacao;
    }

    try {
      const baseRef = ref(db, `clientBases/${baseParaInativar.id}`);
      await update(baseRef, {
        ativo: false,
        motivo_inativo: motivoFinal,
        data_inativacao: new Date().toISOString(),
        inativado_por: currentUser?.uid,
      });

      toast({
        title: "Sucesso",
        description: `Base "${baseParaInativar.nome}" inativada com sucesso!`,
      });

      setModalInativacaoAberto(false);
      setBaseParaInativar(null);
      setMotivoInativacao("");
      setMotivoPersonalizado("");
      setUsarMotivoPersonalizado(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao inativar a base. Tente novamente.",
      });
    }
  };

  const aplicarFiltros = () => {
    setFiltros(filtrosTemporarios);
    setModalPesquisaAberto(false);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      status: "todos",
      tipo: "todos",
    };
    setFiltros(filtrosLimpos);
    setFiltrosTemporarios(filtrosLimpos);
    setBusca("");
    setModalPesquisaAberto(false);
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltrosTemporarios((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const abrirModalPesquisa = () => {
    setFiltrosTemporarios(filtros);
    setModalPesquisaAberto(true);
  };

  const temFiltrosAtivos =
    filtros.status !== "todos" || filtros.tipo !== "todos";

  const exportarCSV = () => {
    const cabecalhos = [
      "ID",
      "Nome",
      "CNPJ",
      "Status",
      "Usuários",
      "Limite Acesso",
      "Criado Por",
      "Data Criação",
    ];

    const linhasCSV = basesFiltradas.map((base) => {
      return [
        `"${base.numberId || ""}"`,
        `"${base.name || ""}"`,
        `"${base.cnpj || ""}"`,
        `"${base.ativo ? "Ativo" : "Inativo"}"`,
        `"${
          base.authorizedUIDs ? Object.keys(base.authorizedUIDs).length : 0
        }"`,
        `"${base.limite_acesso || "Ilimitado"}"`,
        `"${baseCreatorsMap[base.createdBy] || base.createdBy || ""}"`,
        `"${
          base.createdAt
            ? new Date(base.createdAt).toLocaleDateString("pt-BR")
            : ""
        }"`,
      ].join(",");
    });

    const csvContent = [cabecalhos.join(","), ...linhasCSV].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const dataAtual = new Date().toISOString().split("T")[0];
    const nomeArquivo = `bases-${dataAtual}.csv`;
    link.setAttribute("download", nomeArquivo);

    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: string | number | Date | undefined | null) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

            <Dialog
              open={modalPesquisaAberto}
              onOpenChange={setModalPesquisaAberto}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`px-4 ${
                    temFiltrosAtivos
                      ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
                      : "border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                  }`}
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
                      onValueChange={(value) =>
                        handleFiltroChange("status", value)
                      }
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
                <SortableTableHeader
                  sortKey="numberId"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  ID
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Nome da Base
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="cnpj"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  CNPJ
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="userCount"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="center"
                >
                  Usuários
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="userLimit"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="center"
                >
                  Limite
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="createdAt"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Criado em
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="createdBy"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  Criado por
                </SortableTableHeader>
                <SortableTableHeader
                  sortKey="ativo"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="center"
                >
                  Status
                </SortableTableHeader>
                <DataTableHeaderCell align="center">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {basesOrdenadas.length === 0 && (
                <DataTableRow>
                  <DataTableCell
                    className="py-8 text-gray-500"
                    align="center"
                    colSpan={9}
                  >
                    {clientBases.length === 0
                      ? "Nenhuma base cadastrada ainda."
                      : "Nenhuma base encontrada com os filtros aplicados."}
                  </DataTableCell>
                </DataTableRow>
              )}
              {basesOrdenadas.length > 0 &&
                basesOrdenadas.map((base) => (
                  <DataTableRow
                    key={base.id}
                    onClick={() => navegarParaVisualizarBase(base.id)}
                    className={!base.ativo ? "opacity-60" : ""}
                  >
                    <DataTableCell className="font-medium">
                      #{base.numberId || "N/A"}
                    </DataTableCell>
                    <DataTableCell className="font-medium">
                      {base.name}
                    </DataTableCell>
                    <DataTableCell>
                      {base.cnpj ? maskCNPJ(base.cnpj) : "Não informado"}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {getUserCount(base)}
                    </DataTableCell>
                    <DataTableCell align="center">
                      {base.limite_acesso ? base.limite_acesso : "Ilimitado"}
                    </DataTableCell>
                    <DataTableCell>{formatDate(base.createdAt)}</DataTableCell>
                    <DataTableCell>
                      <span className="truncate max-w-32">
                        {baseCreatorsMap[base.createdBy] ||
                          base.createdBy ||
                          "N/A"}
                      </span>
                    </DataTableCell>
                    <DataTableCell align="center">
                      <StatusBadge isActive={base.ativo} />
                    </DataTableCell>
                    <DataTableCell align="center">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton
                          type="edit"
                          onClick={() => navegarParaEditar(base.id)}
                          tooltip="Editar base"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navegarParaContrato(base.id);
                          }}
                          title="Imprimir Contrato"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalInativacao(base.id, base.name);
                          }}
                          title="Inativar base"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Modal de Inativação */}
      <Dialog
        open={modalInativacaoAberto}
        onOpenChange={setModalInativacaoAberto}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inativar Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Tem certeza que deseja inativar a base{" "}
                <strong>"{baseParaInativar?.nome}"</strong>?
              </p>

              {!usarMotivoPersonalizado ? (
                <div>
                  <Label htmlFor="motivo">Motivo da inativação *</Label>
                  <Select
                    value={motivoInativacao}
                    onValueChange={setMotivoInativacao}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inadimplencia">
                        Inadimplência
                      </SelectItem>
                      <SelectItem value="solicitacao_cliente">
                        Solicitação do cliente
                      </SelectItem>
                      <SelectItem value="fim_contrato">
                        Fim de contrato
                      </SelectItem>
                      <SelectItem value="fusao_empresa">
                        Fusão/Aquisição da empresa
                      </SelectItem>
                      <SelectItem value="falencia">
                        Falência/Encerramento
                      </SelectItem>
                      <SelectItem value="migracao_sistema">
                        Migração para outro sistema
                      </SelectItem>
                      <SelectItem value="descumprimento_contrato">
                        Descumprimento de contrato
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm mt-2"
                    onClick={() => setUsarMotivoPersonalizado(true)}
                  >
                    Informar motivo personalizado
                  </Button>
                </div>
              ) : (
                <div>
                  <Label htmlFor="motivoPersonalizado">
                    Motivo personalizado *
                  </Label>
                  <Textarea
                    id="motivoPersonalizado"
                    value={motivoPersonalizado}
                    onChange={(e) => setMotivoPersonalizado(e.target.value)}
                    placeholder="Descreva o motivo da inativação... (mínimo 5 caracteres)"
                    className="mt-1"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Caracteres: {motivoPersonalizado.replace(/\s/g, "").length}
                    /5 (sem contar espaços)
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm mt-2"
                    onClick={() => {
                      setUsarMotivoPersonalizado(false);
                      setMotivoPersonalizado("");
                    }}
                  >
                    Usar motivos padrão
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalInativacaoAberto(false);
                  setBaseParaInativar(null);
                  setMotivoInativacao("");
                  setMotivoPersonalizado("");
                  setUsarMotivoPersonalizado(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={lidarComInativacao}
                variant="destructive"
                disabled={
                  (!usarMotivoPersonalizado && !motivoInativacao) ||
                  (usarMotivoPersonalizado &&
                    motivoPersonalizado.replace(/\s/g, "").length < 5)
                }
              >
                Inativar Base
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
