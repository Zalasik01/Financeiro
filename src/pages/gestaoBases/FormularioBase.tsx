import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import type { ClientBase } from "@/types/store";
import {
  ref,
  push,
  set,
  get,
  update,
  onValue,
  serverTimestamp,
} from "firebase/database";
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Building2,
  FileText,
  Users,
  DollarSign,
  Edit3,
  Trash2,
} from "lucide-react";
import { maskCNPJ, onlyNumbers } from "@/utils/formatters";
import { TabelaUsuariosAutorizados } from "./components/TabelaUsuariosAutorizados";

interface ResponsavelData {
  nome: string;
  telefone: string;
  email: string;
  cargo: string;
  isFinanceiro: boolean;
  isSistema: boolean;
  isContato: boolean;
}

interface ContratoData {
  valorMensal: string;
  dataInicio: string;
  dataVencimento: string;
  prazoMeses: string;
  observacoes: string;
  modalidadePagamento: string;
  diaVencimentoMensal: string;
}

interface ModeloContratoData {
  templateTitle: string;
  templateContent: string;
}

interface AnotacaoData {
  id: string;
  texto: string;
  dataHora: string;
  dataPersonalizada?: string;
  autor: string;
}

export const FormularioBase: React.FC = () => {
  const { baseId } = useParams<{ baseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEdicao = baseId && baseId !== 'nova';

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [limiteUsuarios, setLimiteUsuarios] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [responsaveis, setResponsaveis] = useState<ResponsavelData[]>([{
    nome: '',
    telefone: '',
    email: '',
    cargo: '',
    isFinanceiro: false,
    isSistema: false,
    isContato: false,
  }]);
  
  const [contrato, setContrato] = useState<ContratoData>({
    valorMensal: '',
    dataInicio: '',
    dataVencimento: '',
    prazoMeses: '',
    observacoes: '',
    modalidadePagamento: 'mensal',
    diaVencimentoMensal: '10',
  });

  const [modeloContrato, setModeloContrato] = useState<ModeloContratoData>({
    templateTitle: '',
    templateContent: '',
  });

  const [anotacoes, setAnotacoes] = useState<AnotacaoData[]>([]);
  const [modalAnotacaoAberto, setModalAnotacaoAberto] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [dataAnotacao, setDataAnotacao] = useState('');

  const [nextNumberId, setNextNumberId] = useState<number | null>(null);
  const [currentNumberId, setCurrentNumberId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Função para formatar CNPJ
  const handleCnpjChange = (value: string) => {
    const numerosSomente = onlyNumbers(value);
    // Limita a 14 dígitos (CNPJ)
    if (numerosSomente.length <= 14) {
      const cnpjFormatado = maskCNPJ(numerosSomente);
      setCnpj(cnpjFormatado);
    }
  };

  // Carregar próximo ID
  useEffect(() => {
    const clientBasesRef = ref(db, "clientBases");
    const unsubscribe = onValue(clientBasesRef, (snapshot) => {
      const data = snapshot.val();
      const basesArray = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];

      const maxId =
        basesArray.length > 0
          ? Math.max(...basesArray.map((b: any) => b.numberId || 0))
          : 0;
      setNextNumberId(maxId + 1);
    });
    return () => unsubscribe();
  }, []);

  // Carregar dados para edição
  useEffect(() => {
    if (isEdicao && baseId) {
      setIsLoading(true);
      const baseRef = ref(db, `clientBases/${baseId}`);
      
      get(baseRef).then((snapshot) => {
        if (snapshot.exists()) {
          const baseData = snapshot.val();
          setNome(baseData.name || '');
          setCnpj(baseData.cnpj ? maskCNPJ(baseData.cnpj) : ''); // Formatar CNPJ ao carregar
          setLimiteUsuarios(baseData.limite_acesso?.toString() || '');
          setAtivo(baseData.ativo !== false);
          setCurrentNumberId(baseData.numberId || null);
          
          // Carregar responsáveis
          if (baseData.responsaveis) {
            setResponsaveis(baseData.responsaveis.map((r: any) => ({
              nome: r.nome || '',
              telefone: r.telefone || '',
              email: r.email || '',
              cargo: r.cargo || '',
              isFinanceiro: r.isFinanceiro || false,
              isSistema: r.isSistema || false,
              isContato: r.isContato || false,
            })));
          }
          
          // Carregar dados do contrato
          if (baseData.contrato) {
            setContrato({
              valorMensal: baseData.contrato.valorMensal || '',
              dataInicio: baseData.contrato.dataInicio || '',
              dataVencimento: baseData.contrato.dataVencimento || '',
              prazoMeses: baseData.contrato.prazoMeses || '',
              observacoes: baseData.contrato.observacoes || '',
              modalidadePagamento: baseData.contrato.modalidadePagamento || 'mensal',
              diaVencimentoMensal: baseData.contrato.diaVencimentoMensal || '10',
            });
          }

          // Carregar modelo de contrato
          if (baseData.modeloContrato) {
            setModeloContrato({
              templateTitle: baseData.modeloContrato.templateTitle || '',
              templateContent: baseData.modeloContrato.templateContent || '',
            });
          }

          // Carregar anotações
          if (baseData.anotacoes) {
            setAnotacoes(baseData.anotacoes || []);
          }
        } else {
          toast.error({
            title: "Erro",
            description: "Base não encontrada.",
          });
          navigate('/admin/gestao-bases');
        }
      }).catch((error) => {
        toast.error({
          title: "Erro ao carregar",
          description: `Erro ao carregar dados da base: ${error.message}`,
        });
        navigate('/admin/gestao-bases');
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isEdicao, baseId, navigate]);

  const adicionarResponsavel = () => {
    setResponsaveis([...responsaveis, {
      nome: '',
      telefone: '',
      email: '',
      cargo: '',
      isFinanceiro: false,
      isSistema: false,
      isContato: false,
    }]);
  };

  const removerResponsavel = (index: number) => {
    if (responsaveis.length > 1) {
      setResponsaveis(responsaveis.filter((_, i) => i !== index));
    }
  };

  const updateResponsavel = (index: number, field: keyof ResponsavelData, value: any) => {
    const updated = [...responsaveis];
    updated[index] = { ...updated[index], [field]: value };
    setResponsaveis(updated);
  };

  const updateContrato = (field: keyof ContratoData, value: string) => {
    setContrato(prev => ({ ...prev, [field]: value }));
  };

  const updateModeloContrato = (field: keyof ModeloContratoData, value: string) => {
    setModeloContrato(prev => ({ ...prev, [field]: value }));
  };

  const adicionarAnotacao = () => {
    if (!novaAnotacao.trim()) return;
    
    const dataFinal = dataAnotacao || new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const anotacao: AnotacaoData = {
      id: Date.now().toString(),
      texto: novaAnotacao.trim(),
      dataHora: `${dataFinal} às ${horaAtual}`,
      dataPersonalizada: dataAnotacao,
      autor: currentUser?.displayName || currentUser?.email || 'Usuário'
    };
    
    setAnotacoes(prev => [anotacao, ...prev]);
    setNovaAnotacao('');
    setDataAnotacao('');
    setModalAnotacaoAberto(false);
  };

  const removerAnotacao = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      setAnotacoes(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast.validationError("Nome da base é obrigatório.");
      return;
    }

    if (!cnpj.trim()) {
      toast.validationError("CNPJ é obrigatório.");
      return;
    }

    // Validar se CNPJ tem 14 dígitos
    const cnpjSomenteNumeros = onlyNumbers(cnpj);
    if (cnpjSomenteNumeros.length !== 14) {
      toast.validationError("CNPJ deve conter 14 dígitos.");
      return;
    }

    // Validar responsáveis
    const responsaveisValidos = responsaveis.filter(r => 
      r.nome.trim() && r.telefone.trim()
    );

    if (responsaveisValidos.length === 0) {
      toast.validationError("É necessário pelo menos um responsável com nome e telefone.");
      return;
    }

    setIsSaving(true);

    try {
      const baseData: any = {
        name: nome.trim(),
        cnpj: onlyNumbers(cnpj), // Salvar apenas números
        ativo,
        responsaveis: responsaveisValidos,
        contrato,
        modeloContrato,
        anotacoes,
        authorizedUIDs: {}, // Garantir que authorizedUIDs sempre exista
      };

      // Limite de usuários
      if (limiteUsuarios.trim() && limiteUsuarios !== '0') {
        const limite = parseInt(limiteUsuarios, 10);
        if (isNaN(limite) || limite <= 0) {
          toast.validationError("Limite deve ser um número positivo ou vazio para ilimitado.");
          return;
        }
        baseData.limite_acesso = limite;
      } else {
        baseData.limite_acesso = null;
      }

      if (isEdicao && baseId) {
        // Atualizar base existente
        const baseRef = ref(db, `clientBases/${baseId}`);
        await update(baseRef, baseData);
        toast.updateSuccess(`Base "${nome}"`);
      } else {
        // Criar nova base
        baseData.numberId = nextNumberId;
        baseData.createdAt = serverTimestamp();
        baseData.createdBy = currentUser?.uid;
        // authorizedUIDs já está definido acima

        const clientBasesRef = ref(db, "clientBases");
        const newBaseRef = push(clientBasesRef);
        await set(newBaseRef, baseData);
        
        toast.createSuccess(`Base "${nome}" criada com ID ${nextNumberId}`);
      }

      navigate('/admin/gestao-bases');
    } catch (error) {
      toast.error({
        title: "Erro ao salvar",
        description: `Erro: ${(error as Error).message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/gestao-bases')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isEdicao ? 'Editar Base' : 'Nova Base'}
            </CardTitle>
            {isEdicao && (
              <Badge variant="secondary">ID: {nextNumberId ? nextNumberId - 1 : 'N/A'}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações Básicas
              </h3>
              
              <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={ativo}
                    onCheckedChange={(checked) => setAtivo(checked)}
                  />
                  <Label htmlFor="ativo" className="text-gray-800">Base Ativa</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numberId">ID Numérico</Label>
                  <Input
                    id="numberId"
                    value={isEdicao ? (currentNumberId || 'N/A') : nextNumberId || 'Carregando...'}
                    disabled
                    className="bg-gray-100 border-gray-300"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="nome">Nome da Base *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Cliente Alpha Ltda"
                    className="border-gray-300 hover:border-black focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="border-gray-300 hover:border-black focus:border-black"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="limite">Limite de Usuários</Label>
                  <Input
                    id="limite"
                    type="number"
                    value={limiteUsuarios}
                    onChange={(e) => setLimiteUsuarios(e.target.value)}
                    placeholder="0 = ilimitado"
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-6 border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Responsáveis
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarResponsavel}
                  className="border-gray-300 text-gray-800 hover:bg-gray-800 hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-4">
                {responsaveis.map((responsavel, index) => (
                  <div key={index} className="p-4 border border-gray-300 rounded-lg space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">Responsável {index + 1}</h4>
                      {responsaveis.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerResponsavel(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`responsavel-nome-${index}`}>Nome *</Label>
                        <Input
                          id={`responsavel-nome-${index}`}
                          value={responsavel.nome}
                          onChange={(e) => updateResponsavel(index, 'nome', e.target.value)}
                          placeholder="Nome completo"
                          className="border-gray-300 hover:border-black focus:border-black"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`responsavel-cargo-${index}`}>Cargo</Label>
                        <Input
                          id={`responsavel-cargo-${index}`}
                          value={responsavel.cargo}
                          onChange={(e) => updateResponsavel(index, 'cargo', e.target.value)}
                          placeholder="Ex: Gerente Financeiro"
                          className="border-gray-300 hover:border-black focus:border-black"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`responsavel-telefone-${index}`}>Telefone *</Label>
                        <Input
                          id={`responsavel-telefone-${index}`}
                          value={responsavel.telefone}
                          onChange={(e) => {
                            let valor = e.target.value.replace(/\D/g, '');
                            if (valor.length <= 11) {
                              if (valor.length <= 10) {
                                valor = valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                              } else {
                                valor = valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                              }
                            }
                            updateResponsavel(index, 'telefone', valor);
                          }}
                          placeholder="(00) 00000-0000"
                          className="border-gray-300 hover:border-black focus:border-black"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`responsavel-email-${index}`}>E-mail</Label>
                        <Input
                          id={`responsavel-email-${index}`}
                          type="email"
                          value={responsavel.email}
                          onChange={(e) => updateResponsavel(index, 'email', e.target.value)}
                          placeholder="email@empresa.com"
                          className="border-gray-300 hover:border-black focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Funções</Label>
                      <div className="flex flex-wrap gap-6 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`financeiro-${index}`}
                            checked={responsavel.isFinanceiro}
                            onCheckedChange={(checked) => updateResponsavel(index, 'isFinanceiro', checked)}
                          />
                          <Label htmlFor={`financeiro-${index}`} className="text-sm text-gray-800">Responsável Financeiro</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`sistema-${index}`}
                            checked={responsavel.isSistema}
                            onCheckedChange={(checked) => updateResponsavel(index, 'isSistema', checked)}
                          />
                          <Label htmlFor={`sistema-${index}`} className="text-sm text-gray-800">Responsável pelo Sistema</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`contato-${index}`}
                            checked={responsavel.isContato}
                            onCheckedChange={(checked) => updateResponsavel(index, 'isContato', checked)}
                          />
                          <Label htmlFor={`contato-${index}`} className="text-sm text-gray-800">Contato Principal</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Contrato
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="valorMensal">Valor Mensal</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="valorMensal"
                        value={contrato.valorMensal}
                        onChange={(e) => updateContrato('valorMensal', e.target.value)}
                        placeholder="0,00"
                        className="pl-10 border-gray-300 hover:border-black focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dataInicio">Data de Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={contrato.dataInicio}
                      onChange={(e) => updateContrato('dataInicio', e.target.value)}
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={contrato.dataVencimento}
                      onChange={(e) => updateContrato('dataVencimento', e.target.value)}
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                    <Input
                      id="prazoMeses"
                      type="number"
                      value={contrato.prazoMeses}
                      onChange={(e) => updateContrato('prazoMeses', e.target.value)}
                      placeholder="12"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modalidadePagamento">Modalidade de Pagamento</Label>
                    <select
                      id="modalidadePagamento"
                      value={contrato.modalidadePagamento}
                      onChange={(e) => updateContrato('modalidadePagamento', e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-gray-300 hover:border-black focus:border-black rounded-md text-sm bg-background"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="diaVencimento">Dia do Vencimento Mensal</Label>
                    <Input
                      id="diaVencimento"
                      type="number"
                      min="1"
                      max="31"
                      value={contrato.diaVencimentoMensal}
                      onChange={(e) => updateContrato('diaVencimentoMensal', e.target.value)}
                      placeholder="10"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações do Contrato</Label>
                  <Textarea
                    id="observacoes"
                    value={contrato.observacoes}
                    onChange={(e) => updateContrato('observacoes', e.target.value)}
                    placeholder="Observações adicionais sobre o contrato..."
                    rows={3}
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Modelo de Contrato
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateTitle">Título do Contrato</Label>
                  <Input
                    id="templateTitle"
                    value={modeloContrato.templateTitle}
                    onChange={(e) => updateModeloContrato('templateTitle', e.target.value)}
                    placeholder="Ex: Contrato de Prestação de Serviços de Software"
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
                <div>
                  <Label htmlFor="templateContent">Conteúdo do Contrato</Label>
                  <Textarea
                    id="templateContent"
                    value={modeloContrato.templateContent}
                    onChange={(e) => updateModeloContrato('templateContent', e.target.value)}
                    placeholder="Digite o modelo de contrato que será usado para impressão..."
                    rows={8}
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use variáveis como [NOME_BASE], [CNPJ], [VALOR_MENSAL], [DATA_INICIO] que serão substituídas automaticamente na impressão.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-6 border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Anotações
                </h3>
                <Dialog open={modalAnotacaoAberto} onOpenChange={setModalAnotacaoAberto}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-800 hover:bg-gray-800 hover:text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova Anotação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nova Anotação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="dataAnotacao">Data da Anotação</Label>
                        <Input
                          id="dataAnotacao"
                          type="date"
                          value={dataAnotacao}
                          onChange={(e) => setDataAnotacao(e.target.value)}
                          className="border-gray-300 hover:border-black focus:border-black"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Deixe em branco para usar a data atual.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="novaAnotacao">Anotação</Label>
                        <Textarea
                          id="novaAnotacao"
                          value={novaAnotacao}
                          onChange={(e) => setNovaAnotacao(e.target.value)}
                          placeholder="Digite sua anotação..."
                          rows={4}
                          className="border-gray-300 hover:border-black focus:border-black"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          onClick={adicionarAnotacao}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNovaAnotacao('');
                            setDataAnotacao('');
                            setModalAnotacaoAberto(false);
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-3">
                {anotacoes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma anotação adicionada ainda.</p>
                ) : (
                  anotacoes.map((anotacao) => (
                    <div key={anotacao.id} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-800 mb-2">{anotacao.texto}</p>
                          <div className="text-sm text-gray-500">
                            <span>Por: {anotacao.autor}</span>
                            <span className="mx-2">·</span>
                            <span>Em: {anotacao.dataHora}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerAnotacao(anotacao.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isEdicao && (
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Usuários Autorizados
                    </h3>
                    <TabelaUsuariosAutorizados baseId={baseId} />
                </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/gestao-bases')}
                className="border-gray-300 text-gray-800 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Base'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
