import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/firebase";
import { toast } from "@/lib/toast";
import type { ClientBase } from "@/types/store";
import { ref, get } from "firebase/database";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  Users,
  Edit,
  Download,
} from "lucide-react";

export const ContratoBase: React.FC = () => {
  const { baseId } = useParams<{ baseId: string }>();
  const navigate = useNavigate();
  
  const [base, setBase] = useState<ClientBase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!baseId) {
      navigate('/admin/gestao-bases');
      return;
    }

    const baseRef = ref(db, `clientBases/${baseId}`);
    
    get(baseRef).then((snapshot) => {
      if (snapshot.exists()) {
        setBase({ id: baseId, ...snapshot.val() });
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
  }, [baseId, navigate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: string) => {
    if (!value) return 'N/A';
    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const getModalidadePagamento = (modalidade: string) => {
    const modalidades: { [key: string]: string } = {
      'mensal': 'Mensal',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual'
    };
    return modalidades[modalidade] || modalidade;
  };

  const downloadContrato = () => {
    if (!base?.modeloContrato?.templateContent) {
      toast.error({
        title: "Erro",
        description: "Modelo de contrato não encontrado para esta base.",
      });
      return;
    }

    try {
      // Substituir variáveis no template
      let contratoContent = base.modeloContrato.templateContent;
      
      // Substituições básicas
      contratoContent = contratoContent.replace(/\[NOME_BASE\]/g, base.name || '[NOME_BASE]');
      contratoContent = contratoContent.replace(/\[CNPJ\]/g, base.cnpj || '[CNPJ]');
      contratoContent = contratoContent.replace(/\[VALOR_MENSAL\]/g, 
        base.contrato?.valorMensal ? formatCurrency(base.contrato.valorMensal) : '[VALOR_MENSAL]');
      contratoContent = contratoContent.replace(/\[DATA_INICIO\]/g, 
        base.contrato?.dataInicio ? formatDate(base.contrato.dataInicio) : '[DATA_INICIO]');
      contratoContent = contratoContent.replace(/\[DATA_VENCIMENTO\]/g, 
        base.contrato?.dataVencimento ? formatDate(base.contrato.dataVencimento) : '[DATA_VENCIMENTO]');
      contratoContent = contratoContent.replace(/\[MODALIDADE_PAGAMENTO\]/g, 
        base.contrato?.modalidadePagamento ? getModalidadePagamento(base.contrato.modalidadePagamento) : '[MODALIDADE_PAGAMENTO]');

      // Abrir nova janela para impressão (simulando PDF)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Contrato - ${base.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1 { color: #333; text-align: center; }
              .content { white-space: pre-wrap; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>${base.modeloContrato.templateTitle || 'Contrato de Prestação de Serviços'}</h1>
            <div class="content">${contratoContent}</div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success({
        title: "Sucesso",
        description: "Contrato aberto para impressão/download em PDF!",
      });
    } catch (error) {
      toast.error({
        title: "Erro",
        description: "Erro ao gerar contrato para impressão.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!base) {
    return null;
  }

  return (
    <div className="w-[90%] mx-auto">
      <Card className="bg-[#F4F4F4]">
        <CardHeader>
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
              Contrato - {base.name}
            </h1>
            <Badge variant="secondary">ID: {base.numberId}</Badge>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={downloadContrato}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Imprimir PDF
              </Button>
              <Button
                onClick={() => navigate(`/admin/gestao-bases/editar/${baseId}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar Base
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

      {/* Informações da Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Base
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Nome:</strong> {base.name}
          </div>
          <div>
            <strong>CNPJ:</strong> {base.cnpj || 'N/A'}
          </div>
          <div>
            <strong>Status:</strong>{' '}
            {base.ativo ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Inativo
              </Badge>
            )}
          </div>
          <div>
            <strong>Limite de Usuários:</strong>{' '}
            {base.limite_acesso ? base.limite_acesso : 'Ilimitado'}
          </div>
        </CardContent>
      </Card>

      {/* Responsáveis */}
      {base.responsaveis && base.responsaveis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-medium">
                      Nome
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-medium">
                      Cargo
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-medium">
                      Telefone
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-medium">
                      E-mail
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center font-medium">
                      Funções
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {base.responsaveis.map((responsavel: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium">
                        {responsavel.nome}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                        {responsavel.cargo || 'N/A'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                        {responsavel.telefone}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                        {responsavel.email || 'N/A'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {responsavel.isFinanceiro && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Financeiro
                            </Badge>
                          )}
                          {responsavel.isSistema && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Sistema
                            </Badge>
                          )}
                          {responsavel.isContato && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              Contato
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          {base.contrato ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-500">Valor Mensal</div>
                  <div className="font-semibold text-lg">
                    {formatCurrency(base.contrato.valorMensal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Data de Início</div>
                  <div className="font-semibold">
                    {formatDate(base.contrato.dataInicio)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm text-gray-500">Data de Vencimento</div>
                  <div className="font-semibold">
                    {formatDate(base.contrato.dataVencimento)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-sm text-gray-500">Prazo</div>
                  <div className="font-semibold">
                    {base.contrato.prazoMeses ? `${base.contrato.prazoMeses} meses` : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-500">Modalidade</div>
                  <div className="font-semibold">
                    {getModalidadePagamento(base.contrato.modalidadePagamento)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="text-sm text-gray-500">Vencimento Mensal</div>
                  <div className="font-semibold">
                    Dia {base.contrato.diaVencimentoMensal || '10'}
                  </div>
                </div>
              </div>

              {base.contrato.observacoes && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="text-sm text-gray-500 mb-2">Observações</div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {base.contrato.observacoes}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma informação de contrato cadastrada.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuários Autorizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários Autorizados ({base.authorizedUIDs ? Object.keys(base.authorizedUIDs).length : 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {base.authorizedUIDs && Object.keys(base.authorizedUIDs).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(base.authorizedUIDs).map(([uid, authData]) => (
                <div
                  key={uid}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div>
                    <div className="font-medium">
                      {(authData as any).displayName || 'Nome Desconhecido'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(authData as any).email || 'Email Desconhecido'}
                    </div>
                  </div>
                  <Badge variant="outline">Usuário</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário autorizado nesta base.
            </div>
          )}
        </CardContent>
      </Card>
        </CardContent>
      </Card>
    </div>
  );
};
