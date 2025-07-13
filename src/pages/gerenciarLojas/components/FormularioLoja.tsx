import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, ContatoTelefone, ContatoEmail } from "@/types/store";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { maskCNPJ, onlyNumbers, maskPhone } from "@/utils/formatters";
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FormularioLojaProps {
  loja?: Store;
  onSalvar: (loja: Partial<Store>) => Promise<void>;
  editando?: boolean;
}

export const FormularioLoja: React.FC<FormularioLojaProps> = ({
  loja,
  onSalvar,
  editando = false
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados para os contatos
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDialogType, setContactDialogType] = useState<'telefone' | 'email'>('telefone');
  const [editingContact, setEditingContact] = useState<ContatoTelefone | ContatoEmail | null>(null);
  
  // Estados para o contato sendo editado
  const [contactValue, setContactValue] = useState('');
  const [contactObservacoes, setContactObservacoes] = useState('');
  const [contactIsPrincipal, setContactIsPrincipal] = useState(false);
  
  // Estados para o endereço
  const [endereco, setEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  
  const [formData, setFormData] = useState<Partial<Store>>({
    name: "",
    cnpj: "",
    nickname: "",
    code: "",
    icon: "",
    isDefault: false,
    isMatriz: false,
    telefones: [],
    emails: []
  });
  
  const [displayCNPJ, setDisplayCNPJ] = useState("");

  // Carregar dados da loja se estiver editando
  useEffect(() => {
    console.log("FormularioLoja - useEffect executado");
    console.log("Prop loja recebida:", loja);
    console.log("Flag editando:", editando);
    
    if (loja) {
      console.log("Carregando dados da loja no formulário");
      setFormData({
        name: loja.name || "",
        cnpj: loja.cnpj || "",
        nickname: loja.nickname || "",
        code: loja.code || "",
        icon: loja.icon || "",
        isDefault: loja.isDefault || false,
        isMatriz: loja.isMatriz || false,
        telefones: loja.telefones || [],
        emails: loja.emails || [],
        endereco: loja.endereco || {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        }
      });
      setEndereco({
        logradouro: loja.endereco?.logradouro || '',
        numero: loja.endereco?.numero || '',
        complemento: loja.endereco?.complemento || '',
        bairro: loja.endereco?.bairro || '',
        cidade: loja.endereco?.cidade || '',
        estado: loja.endereco?.estado || '',
        cep: loja.endereco?.cep || ''
      });
      setDisplayCNPJ(maskCNPJ(loja.cnpj || ""));
      console.log("Dados carregados no formulário:", {
        formData: formData,
        endereco: endereco
      });
    } else {
      console.log("Nenhuma loja fornecida, mantendo formulário vazio");
    }
  }, [loja]);

  useEffect(() => {
    if (formData.cnpj) {
      setDisplayCNPJ(maskCNPJ(formData.cnpj));
    }
  }, [formData.cnpj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.cnpj.trim()) {
      toast({
        title: "Erro",
        description: "Nome e CNPJ são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSalvar({
        ...formData,
        cnpj: onlyNumbers(formData.cnpj),
        endereco: endereco
      });

      toast({
        title: "Sucesso!",
        description: editando ? "Loja atualizada com sucesso!" : "Loja cadastrada com sucesso!",
        variant: "success",
      });

      if (!editando) {
        navigate("/loja");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar loja. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCNPJChange = (value: string) => {
    const cleanCNPJ = onlyNumbers(value);
    setFormData(prev => ({ ...prev, cnpj: cleanCNPJ }));
    setDisplayCNPJ(maskCNPJ(cleanCNPJ));
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEnderecoChange = (field: keyof typeof endereco, value: string) => {
    setEndereco(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções para gerenciar contatos
  const abrirDialogoContato = (tipo: 'telefone' | 'email', contato?: ContatoTelefone | ContatoEmail) => {
    setContactDialogType(tipo);
    setEditingContact(contato || null);
    
    if (contato) {
      if (tipo === 'telefone') {
        setContactValue((contato as ContatoTelefone).numero || '');
      } else {
        setContactValue((contato as ContatoEmail).email || '');
      }
      setContactObservacoes(contato.tipo || '');
      setContactIsPrincipal(contato.principal || false);
    } else {
      setContactValue('');
      setContactObservacoes('');
      setContactIsPrincipal(false);
    }
    
    setContactDialogOpen(true);
  };

  const salvarContato = () => {
    if (!contactValue.trim()) {
      toast({
        title: "Erro",
        description: contactDialogType === 'telefone' ? "Número de telefone é obrigatório" : "Email é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const novoContato = {
      id: editingContact ? (editingContact as any).id : Math.random().toString(36).substr(2, 9),
      tipo: contactObservacoes,
      [contactDialogType === 'telefone' ? 'numero' : 'email']: contactValue,
      principal: contactIsPrincipal
    };

    if (contactDialogType === 'telefone') {
      let telefones = [...formData.telefones];
      
      if (editingContact) {
        const index = telefones.findIndex(t => t === editingContact);
        if (index >= 0) {
          telefones[index] = novoContato as ContatoTelefone;
        }
      } else {
        telefones.push(novoContato as ContatoTelefone);
      }
      
      // Se marcar como principal, desmarcar outros
      if (contactIsPrincipal) {
        telefones = telefones.map((t, i) => ({
          ...t,
          principal: telefones.indexOf(novoContato as ContatoTelefone) === i
        }));
      }
      
      setFormData(prev => ({ ...prev, telefones }));
    } else {
      let emails = [...formData.emails];
      
      if (editingContact) {
        const index = emails.findIndex(e => e === editingContact);
        if (index >= 0) {
          emails[index] = novoContato as ContatoEmail;
        }
      } else {
        emails.push(novoContato as ContatoEmail);
      }
      
      // Se marcar como principal, desmarcar outros
      if (contactIsPrincipal) {
        emails = emails.map((e, i) => ({
          ...e,
          principal: emails.indexOf(novoContato as ContatoEmail) === i
        }));
      }
      
      setFormData(prev => ({ ...prev, emails }));
    }

    setContactDialogOpen(false);
    setEditingContact(null);
    setContactValue('');
    setContactObservacoes('');
    setContactIsPrincipal(false);
  };

  const removerContato = (tipo: 'telefone' | 'email', index: number) => {
    if (tipo === 'telefone') {
      const telefones = formData.telefones.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, telefones }));
    } else {
      const emails = formData.emails.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, emails }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/loja")}
          className="flex items-center gap-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">
          {editando ? 'Editar Loja' : 'Nova Loja'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Informações Básicas */}
        <Card className="border">
          <CardHeader className="border-b">
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <User size={20} />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* Switch para Matriz */}
            <div className="flex items-center space-x-2">
              <Switch
                id="matriz"
                checked={formData.isMatriz}
                onCheckedChange={(checked) => handleInputChange('isMatriz', checked)}
              />
              <Label htmlFor="matriz" className="text-gray-800">Matriz</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-800">Nome da Loja *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Loja Centro"
                  required
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>

              <div>
                <Label htmlFor="cnpj" className="text-gray-800">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={displayCNPJ}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  required
                  maxLength={18}
                  disabled={editando}
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nickname" className="text-gray-800">Apelido</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  placeholder="Ex: Centro"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>

              <div>
                <Label htmlFor="code" className="text-gray-800">Código da Loja</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Ex: 001"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
            </div>

            <ImageUpload
              currentIcon={formData.icon}
              onIconChange={(icon) => handleInputChange('icon', icon)}
              placeholder="Ícone da Loja"
            />
          </CardContent>
        </Card>

        {/* Bloco 2: Contatos */}
        <Card className="border">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Phone size={20} />
                Contatos
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDialogoContato('telefone')}
                  className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                >
                  <Plus size={16} />
                  Telefone
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDialogoContato('email')}
                  className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
                >
                  <Plus size={16} />
                  Email
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telefones */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Phone size={16} />
                  Telefones
                </h4>
                {formData.telefones.length === 0 ? (
                  <p className="text-gray-800 text-sm">Nenhum telefone cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {formData.telefones.map((telefone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-gray-800 rounded">
                        <div>
                          <span className="font-medium">{maskPhone(telefone.numero)}</span>
                          {telefone.principal && (
                            <Badge className="ml-2 bg-gray-800 text-white">Principal</Badge>
                          )}
                          {telefone.tipo && (
                            <p className="text-xs text-gray-800">{telefone.tipo}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialogoContato('telefone', telefone)}
                            className="h-8 w-8 p-0 text-gray-800 hover:bg-gray-800 hover:text-white"
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerContato('telefone', index)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emails */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Mail size={16} />
                  Emails
                </h4>
                {formData.emails.length === 0 ? (
                  <p className="text-gray-800 text-sm">Nenhum email cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {formData.emails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-gray-800 rounded">
                        <div>
                          <span className="font-medium">{email.email}</span>
                          {email.principal && (
                            <Badge className="ml-2 bg-gray-800 text-white">Principal</Badge>
                          )}
                          {email.tipo && (
                            <p className="text-xs text-gray-800">{email.tipo}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialogoContato('email', email)}
                            className="h-8 w-8 p-0 text-gray-800 hover:bg-gray-800 hover:text-white"
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerContato('email', index)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 3: Endereço */}
        <Card className="border">
          <CardHeader className="border-b">
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <MapPin size={20} />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* Primeira linha: CEP, Estado, Cidade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep" className="text-gray-800">CEP</Label>
                <Input
                  id="cep"
                  value={endereco.cep}
                  onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                  placeholder="Ex: 01234-567"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="estado" className="text-gray-800">Estado</Label>
                <Input
                  id="estado"
                  value={endereco.estado}
                  onChange={(e) => handleEnderecoChange('estado', e.target.value)}
                  placeholder="Ex: SP"
                  maxLength={2}
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="cidade" className="text-gray-800">Cidade</Label>
                <Input
                  id="cidade"
                  value={endereco.cidade}
                  onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
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
                  value={endereco.bairro}
                  onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                  placeholder="Ex: Centro"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="logradouro" className="text-gray-800">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={endereco.logradouro}
                  onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
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
                  value={endereco.numero}
                  onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                  placeholder="Ex: 123"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="complemento" className="text-gray-800">Complemento</Label>
                <Input
                  id="complemento"
                  value={endereco.complemento}
                  onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                  placeholder="Ex: Sala 101"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/loja")}
            className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-[#1a365d] hover:bg-[#2d5a87] text-white"
          >
            {editando ? 'Salvar Alterações' : 'Cadastrar Loja'}
          </Button>
        </div>
      </form>

      {/* Dialog para adicionar/editar contatos */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editingContact ? 'Editar' : 'Adicionar'} {contactDialogType === 'telefone' ? 'Telefone' : 'Email'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contact-value" className="text-gray-800">
                {contactDialogType === 'telefone' ? 'Número do Telefone' : 'Endereço de Email'}
              </Label>
              <Input
                id="contact-value"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactDialogType === 'telefone' ? '(11) 99999-9999' : 'email@exemplo.com'}
                className="border-gray-300 hover:border-black focus:border-black"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-obs" className="text-gray-800">Tipo</Label>
              <Input
                id="contact-obs"
                value={contactObservacoes}
                onChange={(e) => setContactObservacoes(e.target.value)}
                placeholder="Ex: WhatsApp, Comercial, etc."
                className="border-gray-300 hover:border-black focus:border-black"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="contact-principal"
                checked={contactIsPrincipal}
                onCheckedChange={setContactIsPrincipal}
              />
              <Label htmlFor="contact-principal" className="text-gray-800">
                {contactDialogType === 'telefone' ? 'Telefone principal' : 'Email principal'}
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
              className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarContato}
              className="bg-[#1a365d] hover:bg-[#2d5a87] text-white"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
