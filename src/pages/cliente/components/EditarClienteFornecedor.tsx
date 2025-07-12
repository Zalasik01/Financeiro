import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientesFornecedores } from "@/hooks/useClientesFornecedores";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { ClienteFornecedor } from "@/types/clienteFornecedor";

export const EditarClienteFornecedor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { clientesFornecedores, atualizarClienteFornecedor, adicionarClienteFornecedor } = useClientesFornecedores();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<ClienteFornecedor>>({
    nome: "",
    tipoDocumento: "CPF",
    numeroDocumento: "",
    nomeFantasia: "",
    email: "",
    telefone: "",
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
    ehCliente: false,
    ehFornecedor: false,
    observacoes: "",
  });

  const [carregando, setCarregando] = useState(false);
  const [clienteFornecedor, setClienteFornecedor] = useState<ClienteFornecedor | null>(null);
  const isNovoCliente = !id || id === 'novo';

  useEffect(() => {
    if (id && id !== 'novo' && clientesFornecedores.length > 0) {
      const cf = clientesFornecedores.find(item => item.id === id);
      if (cf) {
        setClienteFornecedor(cf);
        setFormData(cf);
      }
    } else if (isNovoCliente) {
      // Para novo cliente, deixa os valores padrão
      setClienteFornecedor({} as ClienteFornecedor);
    }
  }, [id, clientesFornecedores, isNovoCliente]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    if (!formData.nome || (!formData.ehCliente && !formData.ehFornecedor)) {
      alert("Preencha o nome e selecione se é Cliente ou Fornecedor");
      return;
    }

    setCarregando(true);
    try {
      if (isNovoCliente) {
        // Criar novo cliente/fornecedor
        await adicionarClienteFornecedor({
          ...formData,
          dataCriacao: Date.now(),
          dataAtualizacao: Date.now(),
        } as Omit<ClienteFornecedor, 'id'>);
      } else {
        // Atualizar cliente/fornecedor existente
        if (!id) {
          alert("ID do cliente/fornecedor não encontrado");
          return;
        }
        await atualizarClienteFornecedor(id, {
          ...formData,
          dataAtualizacao: Date.now(),
        } as Partial<ClienteFornecedor>);
      }
      
      navigate("/clientes-fornecedores");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao ${isNovoCliente ? 'criar' : 'editar'} cliente/fornecedor`);
    } finally {
      setCarregando(false);
    }
  };

  const handleVoltar = () => {
    navigate("/clientes-fornecedores");
  };

  if (!clienteFornecedor && !isNovoCliente) {
    return (
      <div className="container mx-auto p-6">
        <Card className="w-full bg-[#F4F4F4] shadow-lg">
          <CardContent className="p-8 text-center">
            <p>Cliente/Fornecedor não encontrado ou carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome/Razão Social *</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Digite o nome ou razão social"
                  className="border-gray-300 hover:border-black focus:border-black"
                  required
                />
              </div>
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
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(value) => handleInputChange("tipoDocumento", value)}
                >
                  <SelectTrigger className="border-gray-300 hover:border-black focus:border-black">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroDocumento">Número do Documento</Label>
                <Input
                  id="numeroDocumento"
                  value={formData.numeroDocumento || ""}
                  onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                  placeholder="Digite o número do documento"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Digite o email"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone || ""}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="Digite o telefone"
                  className="border-gray-300 hover:border-black focus:border-black"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.endereco?.logradouro || ""}
                    onChange={(e) => handleEnderecoChange("logradouro", e.target.value)}
                    placeholder="Rua, Avenida, etc."
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco?.numero || ""}
                    onChange={(e) => handleEnderecoChange("numero", e.target.value)}
                    placeholder="Número"
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.endereco?.complemento || ""}
                    onChange={(e) => handleEnderecoChange("complemento", e.target.value)}
                    placeholder="Apto, Casa, etc."
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco?.bairro || ""}
                    onChange={(e) => handleEnderecoChange("bairro", e.target.value)}
                    placeholder="Bairro"
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco?.cidade || ""}
                    onChange={(e) => handleEnderecoChange("cidade", e.target.value)}
                    placeholder="Cidade"
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.endereco?.estado || ""}
                    onChange={(e) => handleEnderecoChange("estado", e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco?.cep || ""}
                    onChange={(e) => handleEnderecoChange("cep", e.target.value)}
                    placeholder="00000-000"
                    className="border-gray-300 hover:border-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* CNAE (se CNPJ) */}
            {formData.tipoDocumento === "CNPJ" && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Informações CNPJ</h3>
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

            {/* Tipo de Cadastro */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Tipo de Cadastro *</h3>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ehCliente"
                    checked={formData.ehCliente}
                    onCheckedChange={(checked) => handleInputChange("ehCliente", checked)}
                  />
                  <Label htmlFor="ehCliente">É Cliente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ehFornecedor"
                    checked={formData.ehFornecedor}
                    onCheckedChange={(checked) => handleInputChange("ehFornecedor", checked)}
                  />
                  <Label htmlFor="ehFornecedor">É Fornecedor</Label>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ""}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                placeholder="Observações adicionais"
                rows={3}
                className="border-gray-300 hover:border-black focus:border-black"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleVoltar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={carregando} className="bg-blue-600 hover:bg-blue-700">
                {isNovoCliente ? <Plus className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {carregando ? "Salvando..." : isNovoCliente ? "Criar" : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
