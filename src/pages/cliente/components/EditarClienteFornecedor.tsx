import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientesFornecedores } from "@/hooks/useClientesFornecedores";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Edit, MessageCircle, User, Phone, Mail, MapPin, FileText, Building } from "lucide-react";
import { ClienteFornecedor, ContatoTelefone, ContatoEmail } from "@/types/clienteFornecedor";
import { useToast } from "@/hooks/use-toast";
import { FormCEPInput } from "@/components/ui/FormComponents";
import { useViaCEP, AddressData } from "@/hooks/useViaCEP";

// Função para formatar CPF (XXX.XXX.XXX-XX)
const formatCPF = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  return cleanValue;
};

// Função para formatar CNPJ (XX.XXX.XXX/XXXX-XX)
const formatCNPJ = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 14) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2');
  }
  return cleanValue;
};

// Função para formatar telefone (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
const formatTelefone = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    if (cleanValue.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})/, '$1-$2');
    } else {
      // Celular: (XX) XXXXX-XXXX
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})/, '$1-$2');
    }
  }
  return cleanValue;
};

export const EditarClienteFornecedor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { clientesFornecedores, atualizarClienteFornecedor, adicionarClienteFornecedor } = useClientesFornecedores();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detecta se é novo cliente pela rota ou pelo parâmetro
  const isNovoCliente = location.pathname.includes('/novo') || !id || id === 'novo';

  const [formData, setFormData] = useState<Partial<ClienteFornecedor>>({
    nome: "",
    tipoDocumento: "CPF",
    numeroDocumento: "",
    nomeFantasia: "",
    email: "", // Mantido para compatibilidade
    telefone: "", // Mantido para compatibilidade
    emails: [], // Novo array de emails
    telefones: [], // Novo array de telefones
    endereco: {
      descricaoTipoLogradouro: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    },
    cnaeFiscal: "",
    cnaeFiscalDescricao: "",
    ehCliente: true, // Por padrão é cliente
    ehFornecedor: false,
    observacoes: "",
    ativo: true,
  });

  const [carregando, setCarregando] = useState(false);
  const [clienteFornecedor, setClienteFornecedor] = useState<ClienteFornecedor | null>(null);
  
  // Estados para modais de contato
  const [modalTelefoneAberto, setModalTelefoneAberto] = useState(false);
  const [modalEmailAberto, setModalEmailAberto] = useState(false);
  const [editandoTelefone, setEditandoTelefone] = useState<ContatoTelefone | null>(null);
  const [editandoEmail, setEditandoEmail] = useState<ContatoEmail | null>(null);
  
  // Estados para formulários de contato
  const [novoTelefone, setNovoTelefone] = useState({ tipo: "Celular", numero: "", principal: false });
  const [novoEmail, setNovoEmail] = useState({ tipo: "Principal", email: "", principal: false });

  // Hook para integração ViaCEP
  const handleAddressFound = (address: AddressData) => {
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cep: address.zipCode,
        logradouro: address.street,
        bairro: address.neighborhood,
        cidade: address.city,
        estado: address.state,
      }
    }));
  };

  useEffect(() => {
    if (id && id !== 'novo' && clientesFornecedores.length > 0) {
      const cf = clientesFornecedores.find(item => item.id === id);
      if (cf) {
        setClienteFornecedor(cf);
        // Aplica formatação ao carregar os dados
        const dadosFormatados = {
          ...cf,
          numeroDocumento: cf.numeroDocumento && cf.tipoDocumento 
            ? (cf.tipoDocumento === 'CPF' ? formatCPF(cf.numeroDocumento) : formatCNPJ(cf.numeroDocumento))
            : cf.numeroDocumento,
          telefones: cf.telefones || [],
          emails: cf.emails || []
        };
        setFormData(dadosFormatados);
      }
    } else if (isNovoCliente) {
      // Para novo cliente, define como cliente por padrão
      setClienteFornecedor({} as ClienteFornecedor);
      setFormData(prev => ({
        ...prev,
        ehCliente: true,
        ehFornecedor: false,
        ativo: true,
        telefones: [],
        emails: []
      }));
    }
  }, [id, clientesFornecedores, isNovoCliente]);

  // Funções para gerenciar telefones
  const adicionarTelefone = () => {
    if (!novoTelefone.numero.trim()) return;
    
    const telefone: ContatoTelefone = {
      id: Date.now().toString(),
      tipo: novoTelefone.tipo,
      numero: novoTelefone.numero,
      principal: novoTelefone.principal
    };
    
    // Se estiver marcando como principal, remove o principal dos outros
    let telefonesAtualizados = [...(formData.telefones || [])];
    if (novoTelefone.principal) {
      telefonesAtualizados = telefonesAtualizados.map(t => ({...t, principal: false}));
    }
    
    setFormData(prev => ({
      ...prev,
      telefones: [...telefonesAtualizados, telefone]
    }));
    
    setNovoTelefone({ tipo: "Celular", numero: "", principal: false });
    setModalTelefoneAberto(false);
  };

  const editarTelefone = (telefone: ContatoTelefone) => {
    setEditandoTelefone(telefone);
    setNovoTelefone({ 
      tipo: telefone.tipo, 
      numero: telefone.numero,
      principal: telefone.principal || false
    });
    setModalTelefoneAberto(true);
  };

  const salvarEdicaoTelefone = () => {
    if (!editandoTelefone || !novoTelefone.numero.trim()) return;
    
    // Se estiver marcando como principal, remove o principal dos outros
    let telefonesAtualizados = formData.telefones || [];
    if (novoTelefone.principal) {
      telefonesAtualizados = telefonesAtualizados.map(t => 
        t.id === editandoTelefone.id ? t : {...t, principal: false}
      );
    }
    
    setFormData(prev => ({
      ...prev,
      telefones: telefonesAtualizados.map(t => 
        t.id === editandoTelefone.id 
          ? { ...t, tipo: novoTelefone.tipo, numero: novoTelefone.numero, principal: novoTelefone.principal }
          : t
      )
    }));
    
    setEditandoTelefone(null);
    setNovoTelefone({ tipo: "Celular", numero: "", principal: false });
    setModalTelefoneAberto(false);
  };

  const removerTelefone = (id: string) => {
    setFormData(prev => ({
      ...prev,
      telefones: prev.telefones?.filter(t => t.id !== id) || []
    }));
  };

  // Funções para gerenciar emails
  const adicionarEmail = () => {
    if (!novoEmail.email.trim()) return;
    
    const email: ContatoEmail = {
      id: Date.now().toString(),
      tipo: novoEmail.tipo,
      email: novoEmail.email,
      principal: novoEmail.principal
    };
    
    // Se estiver marcando como principal, remove o principal dos outros
    let emailsAtualizados = [...(formData.emails || [])];
    if (novoEmail.principal) {
      emailsAtualizados = emailsAtualizados.map(e => ({...e, principal: false}));
    }
    
    setFormData(prev => ({
      ...prev,
      emails: [...emailsAtualizados, email]
    }));
    
    setNovoEmail({ tipo: "Principal", email: "", principal: false });
    setModalEmailAberto(false);
  };

  const editarEmail = (email: ContatoEmail) => {
    setEditandoEmail(email);
    setNovoEmail({ 
      tipo: email.tipo, 
      email: email.email,
      principal: email.principal || false
    });
    setModalEmailAberto(true);
  };

  const salvarEdicaoEmail = () => {
    if (!editandoEmail || !novoEmail.email.trim()) return;
    
    // Se estiver marcando como principal, remove o principal dos outros
    let emailsAtualizados = formData.emails || [];
    if (novoEmail.principal) {
      emailsAtualizados = emailsAtualizados.map(e => 
        e.id === editandoEmail.id ? e : {...e, principal: false}
      );
    }
    
    setFormData(prev => ({
      ...prev,
      emails: emailsAtualizados.map(e => 
        e.id === editandoEmail.id 
          ? { ...e, tipo: novoEmail.tipo, email: novoEmail.email, principal: novoEmail.principal }
          : e
      )
    }));
    
    setEditandoEmail(null);
    setNovoEmail({ tipo: "Principal", email: "", principal: false });
    setModalEmailAberto(false);
  };

  const removerEmail = (id: string) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails?.filter(e => e.id !== id) || []
    }));
  };

  const fecharModalTelefone = () => {
    setModalTelefoneAberto(false);
    setEditandoTelefone(null);
    setNovoTelefone({ tipo: "Celular", numero: "", principal: false });
  };

  const fecharModalEmail = () => {
    setModalEmailAberto(false);
    setEditandoEmail(null);
    setNovoEmail({ tipo: "Principal", email: "", principal: false });
  };

  // Função para abrir WhatsApp
  const abrirWhatsApp = (numero: string) => {
    // Remove formatação e caracteres especiais, mantém apenas números
    const numeroLimpo = numero.replace(/\D/g, '');
    // Adiciona código do Brasil (55) se não tiver
    const numeroCompleto = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    const url = `https://wa.me/${numeroCompleto}`;
    window.open(url, '_blank');
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'numeroDocumento') {
      // Remove caracteres não numéricos para validação
      const cleanValue = value.replace(/\D/g, '');
      const maxLength = formData.tipoDocumento === 'CPF' ? 11 : 14;
      
      if (cleanValue.length <= maxLength) {
        // Aplica formatação baseada no tipo de documento
        const formattedValue = formData.tipoDocumento === 'CPF' 
          ? formatCPF(value) 
          : formatCNPJ(value);
        
        setFormData(prev => ({
          ...prev,
          [field]: formattedValue
        }));
      }
    } else if (field === 'tipoDocumento') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        numeroDocumento: '', // Limpa o documento ao trocar o tipo
        nomeFantasia: value === 'CPF' ? '' : prev.nomeFantasia // Limpa nome fantasia se for CPF
      }));
    } else if (field === 'ehFornecedor' && value === true) {
      // Se marcar fornecedor, continua sendo cliente também (pode ser ambos)
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEnderecoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica: nome é obrigatório
    if (!formData.nome?.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Validação: deve ser cliente ou fornecedor
    if (!formData.ehCliente && !formData.ehFornecedor) {
      toast({
        title: "Erro de Validação", 
        description: "Selecione se é Cliente, Fornecedor ou ambos",
        variant: "destructive",
      });
      return;
    }

    // Validação de documento se preenchido
    if (formData.numeroDocumento?.trim()) {
      const cleanDocument = formData.numeroDocumento.replace(/\D/g, '');
      const expectedLength = formData.tipoDocumento === 'CPF' ? 11 : 14;
      if (cleanDocument.length !== expectedLength) {
        toast({
          title: "Erro de Validação",
          description: `${formData.tipoDocumento} deve ter ${expectedLength} dígitos`,
          variant: "destructive",
        });
        return;
      }
    }

    setCarregando(true);
    try {
      // Prepara os dados para salvamento, limpando formatação do documento
      const dadosParaSalvar = {
        ...formData,
        numeroDocumento: formData.numeroDocumento ? formData.numeroDocumento.replace(/\D/g, '') : ''
      };

      if (isNovoCliente) {
        // Criar novo cliente/fornecedor
        await adicionarClienteFornecedor({
          ...dadosParaSalvar,
          dataCriacao: Date.now(),
          dataAtualizacao: Date.now(),
        } as Omit<ClienteFornecedor, 'id'>);
      } else {
        // Atualizar cliente/fornecedor existente
        if (!id) {
          toast({
            title: "Erro",
            description: "ID do cliente/fornecedor não encontrado",
            variant: "destructive",
          });
          return;
        }
        await atualizarClienteFornecedor(id, {
          ...dadosParaSalvar,
          dataAtualizacao: Date.now(),
        } as Partial<ClienteFornecedor>);
      }
      
      navigate("/clientes-fornecedores");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao Salvar",
        description: `Erro ao ${isNovoCliente ? 'criar' : 'editar'} cliente/fornecedor`,
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleVoltar = () => {
    navigate("/clientes-fornecedores");
  };

  if (!clienteFornecedor && !isNovoCliente) {
    return (
      <div className="w-[90%] mx-auto p-6">
        <Card className="w-full bg-[#F4F4F4] shadow-lg">
          <CardContent className="p-8 text-center">
            <p>Cliente/Fornecedor não encontrado ou carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto p-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleVoltar}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isNovoCliente ? 'Novo Cliente/Fornecedor' : 'Editar Cliente/Fornecedor'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* BLOCO 1: Informações Básicas */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <User size={20} />
                Informações Básicas
              </h3>
              
              {/* Status - Ativo, Cliente e Fornecedor no topo */}
              <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => handleInputChange("ativo", checked)}
                  />
                  <Label htmlFor="ativo" className="text-gray-800">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ehCliente"
                    checked={formData.ehCliente}
                    onCheckedChange={(checked) => handleInputChange("ehCliente", checked)}
                  />
                  <Label htmlFor="ehCliente" className="text-gray-800">Cliente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ehFornecedor"
                    checked={formData.ehFornecedor}
                    onCheckedChange={(checked) => handleInputChange("ehFornecedor", checked)}
                  />
                  <Label htmlFor="ehFornecedor" className="text-gray-800">Fornecedor</Label>
                </div>
              </div>

              {/* Tipo de Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                  <Select
                    value={formData.tipoDocumento}
                    onValueChange={(value) => handleInputChange("tipoDocumento", value)}
                    disabled={!isNovoCliente}
                  >
                    <SelectTrigger className="border-gray-300 hover:border-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="numeroDocumento">
                    {formData.tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ'} 
                    {formData.numeroDocumento && (
                      <span className="text-sm text-gray-500 ml-1">
                        ({(formData.numeroDocumento || '').replace(/\D/g, '').length}/{formData.tipoDocumento === 'CPF' ? '11' : '14'})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="numeroDocumento"
                    value={formData.numeroDocumento || ""}
                    onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                    placeholder={`Digite o ${formData.tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ'}`}
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
              </div>

              {/* Nome/Razão Social + Nome Fantasia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">
                    {formData.tipoDocumento === 'CPF' ? 'Nome Completo' : 'Razão Social'} *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome || ""}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder={`Digite o ${formData.tipoDocumento === 'CPF' ? 'nome completo' : 'razão social'}`}
                    className="border-gray-300 hover:border-black focus:border-black"
                    required
                  />
                </div>
                {formData.tipoDocumento === 'CNPJ' && (
                  <div>
                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                    <Input
                      id="nomeFantasia"
                      value={formData.nomeFantasia || ""}
                      onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                      placeholder="Digite o nome fantasia"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* BLOCO 2: Contatos */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <MessageCircle size={20} />
                Contatos
              </h3>
              
              {/* Telefones */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">Telefones</Label>
                  <Dialog open={modalTelefoneAberto} onOpenChange={setModalTelefoneAberto}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setModalTelefoneAberto(true)}
                        className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editandoTelefone ? 'Editar Telefone' : 'Novo Telefone'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tipoTelefone">Tipo de Telefone</Label>
                          <Select
                            value={novoTelefone.tipo}
                            onValueChange={(value) => setNovoTelefone(prev => ({...prev, tipo: value}))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Celular">Celular</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="Comercial">Comercial</SelectItem>
                              <SelectItem value="Residencial">Residencial</SelectItem>
                              <SelectItem value="Fax">Fax</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="numeroTelefone">Número</Label>
                          <Input
                            id="numeroTelefone"
                            value={novoTelefone.numero}
                            onChange={(e) => setNovoTelefone(prev => ({
                              ...prev, 
                              numero: formatTelefone(e.target.value)
                            }))}
                            placeholder="(XX) XXXXX-XXXX"
                            className="border-gray-300 hover:border-black focus:border-black"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="principalTelefone"
                            checked={novoTelefone.principal}
                            onCheckedChange={(checked) => setNovoTelefone(prev => ({
                              ...prev, 
                              principal: checked
                            }))}
                          />
                          <Label htmlFor="principalTelefone">Telefone Principal</Label>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button 
                            type="button"
                            onClick={editandoTelefone ? salvarEdicaoTelefone : adicionarTelefone}
                            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
                          >
                            {editandoTelefone ? 'Salvar' : 'Adicionar'}
                          </Button>
                          <Button 
                            type="button"
                            variant="outline" 
                            onClick={fecharModalTelefone}
                            className="flex-1 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {formData.telefones && formData.telefones.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de telefone</TableHead>
                          <TableHead>Número</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead className="w-32">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.telefones.map((telefone) => (
                          <TableRow key={telefone.id}>
                            <TableCell>{telefone.tipo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{telefone.numero}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirWhatsApp(telefone.numero)}
                                  className="p-1 h-6 w-6"
                                  title="Abrir no WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {telefone.principal && (
                                <span className="text-xs bg-blue-50 text-[#1a365d] px-2 py-1 rounded border border-[#1a365d]/20">
                                  Principal
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editarTelefone(telefone);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removerTelefone(telefone.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum registro encontrado</p>
                )}
              </div>

              {/* Separador */}
              <div className="my-8">
                <hr className="border-gray-200" />
              </div>

              {/* Emails */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">E-mails</Label>
                  <Dialog open={modalEmailAberto} onOpenChange={setModalEmailAberto}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setModalEmailAberto(true)}
                        className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editandoEmail ? 'Editar E-mail' : 'Novo E-mail'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tipoEmail">Tipo</Label>
                          <Select
                            value={novoEmail.tipo}
                            onValueChange={(value) => setNovoEmail(prev => ({...prev, tipo: value}))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Principal">Principal</SelectItem>
                              <SelectItem value="Comercial">Comercial</SelectItem>
                              <SelectItem value="Pessoal">Pessoal</SelectItem>
                              <SelectItem value="Financeiro">Financeiro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="enderecoEmail">E-mail</Label>
                          <Input
                            id="enderecoEmail"
                            type="email"
                            value={novoEmail.email}
                            onChange={(e) => setNovoEmail(prev => ({
                              ...prev, 
                              email: e.target.value
                            }))}
                            placeholder="exemplo@email.com"
                            className="border-gray-300 hover:border-black focus:border-black"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="principalEmail"
                            checked={novoEmail.principal}
                            onCheckedChange={(checked) => setNovoEmail(prev => ({
                              ...prev, 
                              principal: checked
                            }))}
                          />
                          <Label htmlFor="principalEmail">E-mail Principal</Label>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button 
                            type="button"
                            onClick={editandoEmail ? salvarEdicaoEmail : adicionarEmail}
                            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
                          >
                            {editandoEmail ? 'Salvar' : 'Adicionar'}
                          </Button>
                          <Button 
                            type="button"
                            variant="outline" 
                            onClick={fecharModalEmail}
                            className="flex-1 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {formData.emails && formData.emails.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead className="w-24">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.emails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell>{email.tipo}</TableCell>
                            <TableCell>{email.email}</TableCell>
                            <TableCell>
                              {email.principal && (
                                <span className="text-xs bg-blue-50 text-[#1a365d] px-2 py-1 rounded border border-[#1a365d]/20">
                                  Principal
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editarEmail(email);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removerEmail(email.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum registro encontrado</p>
                )}
              </div>
            </div>

            {/* BLOCO 3: Endereço */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <MapPin size={20} />
                Endereço
              </h3>

              <div className="space-y-4">
                {/* Primeira linha: CEP, Estado, Cidade */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormCEPInput
                    value={formData.endereco?.cep || ""}
                    onChange={(e) => handleEnderecoChange("cep", e.target.value)}
                    onAddressFound={handleAddressFound}
                    label="CEP"
                  />
                  <div>
                    <Label htmlFor="estado" className="text-gray-800">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.endereco?.estado || ""}
                      onChange={(e) => handleEnderecoChange("estado", e.target.value)}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade" className="text-gray-800">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.endereco?.cidade || ""}
                      onChange={(e) => handleEnderecoChange("cidade", e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                </div>

                {/* Segunda linha: Bairro, Logradouro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bairro" className="text-gray-800">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.endereco?.bairro || ""}
                      onChange={(e) => handleEnderecoChange("bairro", e.target.value)}
                      placeholder="Ex: Centro"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logradouro" className="text-gray-800">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.endereco?.logradouro || ""}
                      onChange={(e) => handleEnderecoChange("logradouro", e.target.value)}
                      placeholder="Ex: Rua das Flores"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                </div>

                {/* Terceira linha: Número, Complemento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero" className="text-gray-800">Número</Label>
                    <Input
                      id="numero"
                      value={formData.endereco?.numero || ""}
                      onChange={(e) => handleEnderecoChange("numero", e.target.value)}
                      placeholder="Ex: 123"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complemento" className="text-gray-800">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.endereco?.complemento || ""}
                      onChange={(e) => handleEnderecoChange("complemento", e.target.value)}
                      placeholder="Ex: Sala 101"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 4: Informações CNPJ (se aplicável) */}
            {formData.tipoDocumento === "CNPJ" && (
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                  <Building size={20} />
                  Informações CNPJ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnaeFiscal">CNAE Fiscal</Label>
                    <Input
                      id="cnaeFiscal"
                      value={formData.cnaeFiscal || ""}
                      onChange={(e) => handleInputChange("cnaeFiscal", e.target.value)}
                      placeholder="Código CNAE"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnaeFiscalDescricao">Descrição CNAE</Label>
                    <Input
                      id="cnaeFiscalDescricao"
                      value={formData.cnaeFiscalDescricao || ""}
                      onChange={(e) => handleInputChange("cnaeFiscalDescricao", e.target.value)}
                      placeholder="Descrição da atividade"
                      className="border-gray-300 hover:border-black focus:border-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BLOCO 5: Observações */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center gap-2">
                <FileText size={20} />
                Observações
              </h3>
              <div>
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ""}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  placeholder="Observações adicionais sobre o cliente/fornecedor"
                  rows={3}
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handleVoltar} className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white">
                  Cancelar
                </Button>
                <Button type="submit" disabled={carregando} className="bg-gray-800 hover:bg-gray-900 text-white">
                  {isNovoCliente ? <Plus className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {carregando ? "Salvando..." : isNovoCliente ? "Criar" : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
