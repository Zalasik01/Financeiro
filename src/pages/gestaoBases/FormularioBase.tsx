import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

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

  const [nextNumberId, setNextNumberId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
          setCnpj(baseData.cnpj || '');
          setLimiteUsuarios(baseData.limite_acesso?.toString() || '');
          setAtivo(baseData.ativo !== false);
          
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
        cnpj: cnpj.trim(),
        ativo,
        responsaveis: responsaveisValidos,
        contrato,
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
        baseData.authorizedUIDs = {};

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/gestao-bases')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdicao ? 'Editar Base' : 'Nova Base'}
        </h1>
        {isEdicao && (
          <Badge variant="secondary">ID: {nextNumberId ? nextNumberId - 1 : 'N/A'}</Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="numberId">ID Numérico</Label>
                <Input
                  id="numberId"
                  value={isEdicao ? 'Carregando...' : nextNumberId || 'Carregando...'}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome da Base *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cliente Alpha Ltda"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
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
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={ativo}
                onCheckedChange={(checked) => setAtivo(checked as boolean)}
              />
              <Label htmlFor="ativo">Base ativa</Label>
            </div>
          </CardContent>
        </Card>

        {/* Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Responsáveis
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarResponsavel}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {responsaveis.map((responsavel, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Responsável {index + 1}</h4>
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
                    <Label>Nome *</Label>
                    <Input
                      value={responsavel.nome}
                      onChange={(e) => updateResponsavel(index, 'nome', e.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <Input
                      value={responsavel.cargo}
                      onChange={(e) => updateResponsavel(index, 'cargo', e.target.value)}
                      placeholder="Ex: Gerente Financeiro"
                    />
                  </div>
                  <div>
                    <Label>Telefone *</Label>
                    <Input
                      value={responsavel.telefone}
                      onChange={(e) => updateResponsavel(index, 'telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={responsavel.email}
                      onChange={(e) => updateResponsavel(index, 'email', e.target.value)}
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Funções</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={responsavel.isFinanceiro}
                        onCheckedChange={(checked) => updateResponsavel(index, 'isFinanceiro', checked)}
                      />
                      <Label className="text-sm">Responsável Financeiro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={responsavel.isSistema}
                        onCheckedChange={(checked) => updateResponsavel(index, 'isSistema', checked)}
                      />
                      <Label className="text-sm">Responsável pelo Sistema</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={responsavel.isContato}
                        onCheckedChange={(checked) => updateResponsavel(index, 'isContato', checked)}
                      />
                      <Label className="text-sm">Contato Principal</Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Informações do Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valorMensal">Valor Mensal</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="valorMensal"
                    value={contrato.valorMensal}
                    onChange={(e) => updateContrato('valorMensal', e.target.value)}
                    placeholder="0,00"
                    className="pl-10"
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
                />
              </div>
              <div>
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={contrato.dataVencimento}
                  onChange={(e) => updateContrato('dataVencimento', e.target.value)}
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
                />
              </div>
              <div>
                <Label htmlFor="modalidadePagamento">Modalidade de Pagamento</Label>
                <select
                  id="modalidadePagamento"
                  value={contrato.modalidadePagamento}
                  onChange={(e) => updateContrato('modalidadePagamento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/gestao-bases')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Base'}
          </Button>
        </div>
      </form>
    </div>
  );
};
