import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"; // Importa o tipo
import { maskCNPJ, maskCPF, maskCEP, maskPhone, onlyNumbers } from "@/utils/formatters"; // Importa funções de máscara
import { HelpTooltip } from "@/components/ui/HelpToolTip"; // Importa o componente de dicas
import { Loader2, User, Building } from "lucide-react"; // Ícone de carregamento e para tipo de pessoa
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Para seleção de tipo

// Props esperadas pelo formulário
interface ClienteFornecedorFormProps {
  dadosIniciais?: ClienteFornecedor | null; // Dados para edição, opcional
  aoSubmeter: (dados: Omit<ClienteFornecedor, "id" | "dataCadastro" | "dataAtualizacao">) => Promise<string | null | void>; // Função chamada ao submeter
  aoCancelar: () => void; // Função chamada ao cancelar
  estaEditando: boolean; // Indica se o formulário está em modo de edição
}

export const ClienteFornecedorForm: React.FC<ClienteFornecedorFormProps> = ({
  dadosIniciais,
  aoSubmeter,
  aoCancelar,
  estaEditando,
}) => {
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [camposDesabilitados, setCamposDesabilitados] = useState(false);
  // Estado inicial do formulário
  const [formData, setFormData] = useState<Omit<ClienteFornecedor, "id" | "dataCadastro" | "dataAtualizacao">>({
    nome: "",
    tipoDocumento: "CPF", // Padrão inicial, será alterado pelo RadioGroup
    numeroDocumento: "",
    email: "",
    telefone: "",
    nomeFantasia: "",
    endereco: {
      logradouro: "",
      numero: "",
      descricaoTipoLogradouro: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    },
    cnaeFiscal: "",
    cnaeFiscalDescricao: "",
    ehCliente: true,
    ehFornecedor: false,
    observacoes: "",
  });

  // Efeito para preencher o formulário com dados iniciais (para edição)
  useEffect(() => {
    if (dadosIniciais) {
      setFormData({
        nome: dadosIniciais.nome || "",
        tipoDocumento: dadosIniciais.tipoDocumento || "CPF",
        numeroDocumento: dadosIniciais.numeroDocumento || "",
        email: dadosIniciais.email || "",
        telefone: dadosIniciais.telefone || "",
        nomeFantasia: dadosIniciais.tipoDocumento === "CNPJ" ? dadosIniciais.nomeFantasia || "" : "",
        endereco: dadosIniciais.endereco || {
          logradouro: "", numero: "", descricaoTipoLogradouro: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "",
        },
        cnaeFiscal: dadosIniciais.tipoDocumento === "CNPJ" ? dadosIniciais.cnaeFiscal || "" : "",
        cnaeFiscalDescricao: dadosIniciais.tipoDocumento === "CNPJ" ? dadosIniciais.cnaeFiscalDescricao || "" : "",
        ehCliente: dadosIniciais.ehCliente !== undefined ? dadosIniciais.ehCliente : true,
        ehFornecedor: dadosIniciais.ehFornecedor || false,
        observacoes: dadosIniciais.observacoes || "",
      });
    } else { // Resetar para o estado inicial se não houver dados iniciais (ex: ao mudar de edição para novo)
      setFormData({
        nome: "",
        tipoDocumento: "CPF", // Padrão ao criar novo
        numeroDocumento: "",
        email: "",
        telefone: "",
        nomeFantasia: "",
        endereco: { logradouro: "", numero: "", descricaoTipoLogradouro: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "" },
        cnaeFiscal: "",
        cnaeFiscalDescricao: "",
        ehCliente: true,
        ehFornecedor: false,
        observacoes: "",
      });
    }
  }, [dadosIniciais]);

  // Manipulador genérico para campos de input e textarea
  const manipularMudanca = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manipulador específico para campos de endereço
  const manipularMudancaEndereco = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let valorProcessado = value;
    if (name === "cep") {
      valorProcessado = maskCEP(value); // Aplica máscara de CEP
    }
    setFormData((prev) => ({
      ...prev,
      endereco: { ...prev.endereco!, [name]: valorProcessado },
    }));
  };

  // Manipulador para o campo de número do documento, aplicando máscara conforme o tipo
  const manipularMudancaDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let valorMascarado = value;
    if (formData.tipoDocumento === "CPF") {
      valorMascarado = maskCPF(value);
    } else if (formData.tipoDocumento === "CNPJ") {
      valorMascarado = maskCNPJ(value);
    }
    setFormData(prev => ({ ...prev, numeroDocumento: valorMascarado }));
  };

  const handleTipoDocumentoChange = (valor: "CPF" | "CNPJ") => {
    setFormData(prev => ({
      ...prev,
      tipoDocumento: valor,
      numeroDocumento: "", // Limpa o número do documento ao trocar o tipo
      nomeFantasia: valor === "CNPJ" ? prev.nomeFantasia : "", // Limpa nome fantasia se não for CNPJ
      // Outros campos específicos de CNPJ podem ser limpos aqui também
    }));
  };

  // Efeito para buscar CNPJ automaticamente
  useEffect(() => {
    const buscarCnpjSeValido = async () => {
      if (formData.tipoDocumento === "CNPJ" && !estaEditando && formData.numeroDocumento && onlyNumbers(formData.numeroDocumento).length === 14 && !buscandoCNPJ) {
        await buscarDadosCNPJ();
      }
    };
    buscarCnpjSeValido();
  }, [formData.numeroDocumento, formData.tipoDocumento, estaEditando]); // Adicionado buscandoCNPJ como dependência para evitar loops

  // Manipulador para o campo de telefone, aplicando máscara
  const manipularMudancaTelefone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, telefone: maskPhone(e.target.value) }));
  };

  // Manipulador para os checkboxes "É Cliente" e "É Fornecedor"
  const manipularMudancaCheckbox = (campo: "ehCliente" | "ehFornecedor") => {
    setFormData((prev) => ({ ...prev, [campo]: !prev[campo] }));
  };

  // Manipulador para submissão do formulário
  const submeterFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Adicionar validações mais robustas aqui, se necessário
    if (!formData.nome.trim()) {
      alert("O nome é obrigatório."); // Exemplo simples de validação
      return;
    }
    await aoSubmeter(formData);
  };

  const buscarDadosCNPJ = async () => {
    const cnpjLimpo = onlyNumbers(formData.numeroDocumento || "");
    if (cnpjLimpo.length !== 14) {
      alert("Por favor, insira um CNPJ válido com 14 dígitos.");
      return;
    }
    setBuscandoCNPJ(true);
    setCamposDesabilitados(true);
    try {
      // Substitua pela URL da sua API de consulta de CNPJ.
      // Algumas APIs públicas podem ter limites de taxa ou exigir chaves.
      // Exemplo usando uma API pública (verifique os termos de uso):
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) {
        const erroData = await response.json();
        throw new Error(erroData.message || `Erro ao buscar CNPJ: ${response.statusText}`);
      }
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        // Preenche apenas se o campo estiver vazio ou for o padrão da API
        nome: prev.nome.trim() === "" ? (data.razao_social || "") : prev.nome,
        nomeFantasia: prev.nomeFantasia?.trim() === "" ? (data.nome_fantasia || "") : prev.nomeFantasia,
        email: prev.email?.trim() === "" ? (data.email || "") : prev.email,
        telefone: prev.telefone?.trim() === "" ? (data.ddd_telefone_1 ? maskPhone(`${data.ddd_telefone_1}`) : "") : prev.telefone,
        // Garante que o objeto endereco exista antes de tentar espalhar suas propriedades
        endereco: {
          logradouro: prev.endereco?.logradouro?.trim() === "" ? (data.logradouro || "") : prev.endereco?.logradouro,
          numero: prev.endereco?.numero?.trim() === "" ? (data.numero || "") : prev.endereco?.numero,
          complemento: prev.endereco?.complemento?.trim() === "" ? (data.complemento || "") : prev.endereco?.complemento,
          bairro: prev.endereco?.bairro?.trim() === "" ? (data.bairro || "") : prev.endereco?.bairro,
          cidade: prev.endereco?.cidade?.trim() === "" ? (data.municipio || "") : prev.endereco?.cidade,
          estado: prev.endereco?.estado?.trim() === "" ? (data.uf || "") : prev.endereco?.estado,
          cep: prev.endereco?.cep?.trim() === "" ? (data.cep ? maskCEP(data.cep) : "") : prev.endereco?.cep,
          descricaoTipoLogradouro: prev.endereco?.descricaoTipoLogradouro?.trim() === "" ? (data.descricao_tipo_de_logradouro || "") : prev.endereco?.descricaoTipoLogradouro,
        } as ClienteFornecedor['endereco'], // Força a tipagem correta
        cnaeFiscal: prev.cnaeFiscal?.trim() === "" ? (data.cnae_fiscal?.toString() || "") : prev.cnaeFiscal,
        cnaeFiscalDescricao: prev.cnaeFiscalDescricao?.trim() === "" ? (data.cnae_fiscal_descricao || "") : prev.cnaeFiscalDescricao,
        // Você pode decidir se quer marcar como fornecedor automaticamente
        // ehFornecedor: true, 
      }));
      // alert("Dados do CNPJ carregados!"); // Pode ser substituído por um toast ou removido

    } catch (erro) {
      console.error("Falha ao buscar dados do CNPJ:", erro);
      alert(`Não foi possível buscar os dados do CNPJ: ${(erro as Error).message}`);
    } finally {
      setBuscandoCNPJ(false);
      setCamposDesabilitados(false);
    }
  };

  return (
    <form onSubmit={submeterFormulario} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
      {!estaEditando && (
        <div className="mb-6 p-4 border-b">
          <Label className="text-base font-medium">Tipo de Cadastro</Label>
          <RadioGroup 
            value={formData.tipoDocumento === "Outro" ? "CPF" : formData.tipoDocumento} // Garante que 'Outro' não seja selecionado aqui
            onValueChange={handleTipoDocumentoChange} 
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CPF" id="tipo-cpf-form" />
              <Label htmlFor="tipo-cpf-form" className="flex items-center gap-2 cursor-pointer"><User size={18}/> Pessoa Física</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CNPJ" id="tipo-cnpj-form" />
              <Label htmlFor="tipo-cnpj-form" className="flex items-center gap-2 cursor-pointer"><Building size={18}/> Pessoa Jurídica</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      <div>
        <Label htmlFor="nome">{formData.tipoDocumento === "CNPJ" ? "Razão Social *" : "Nome *"}</Label>
        <Input id="nome" name="nome" value={formData.nome} onChange={manipularMudanca} required disabled={camposDesabilitados} />
      </div>
      {formData.tipoDocumento === "CNPJ" && (
        <div>
          <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
          <Input id="nomeFantasia" name="nomeFantasia" value={formData.nomeFantasia} onChange={manipularMudanca} disabled={camposDesabilitados} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4"> 
        {/* O Select de tipoDocumento foi removido, pois agora é controlado pelo RadioGroup no topo para novos cadastros */}
        {/* E para edição, o tipoDocumento não deve ser alterado. */}
        <div>
          <Label htmlFor="numeroDocumento">{formData.tipoDocumento === "CPF" ? "CPF" : formData.tipoDocumento === "CNPJ" ? "CNPJ" : "Número do Documento"}</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="numeroDocumento" 
              name="numeroDocumento" 
              value={formData.numeroDocumento} 
              onChange={manipularMudancaDocumento} 
              maxLength={formData.tipoDocumento === "CPF" ? 14 : 18} // CNPJ sempre 18 com máscara
              disabled={camposDesabilitados || (estaEditando && (formData.tipoDocumento === "CPF" || formData.tipoDocumento === "CNPJ"))}
            />
            {buscandoCNPJ && <Loader2 className="h-5 w-5 animate-spin text-blue-500 ml-2" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={manipularMudanca} disabled={camposDesabilitados} />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" value={formData.telefone} onChange={manipularMudancaTelefone} placeholder="(XX) XXXXX-XXXX" disabled={camposDesabilitados} />
        </div>
      </div>

      {/* Seção de Endereço */}
      <fieldset className="border p-4 rounded-md space-y-3">
        <legend className="text-sm font-medium px-1">Endereço</legend>
        {formData.tipoDocumento === "CNPJ" && (
          <div>
            <Label htmlFor="descricaoTipoLogradouro">Tipo Logradouro</Label>
            <Input id="descricaoTipoLogradouro" name="descricaoTipoLogradouro" value={formData.endereco?.descricaoTipoLogradouro || ""} onChange={manipularMudancaEndereco} placeholder="Ex: Rua, Avenida" disabled={camposDesabilitados} />
          </div>
        )}
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" name="cep" value={formData.endereco?.cep} onChange={manipularMudancaEndereco} placeholder="XXXXX-XXX" disabled={camposDesabilitados} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input id="logradouro" name="logradouro" value={formData.endereco?.logradouro || ""} onChange={manipularMudancaEndereco} disabled={camposDesabilitados} />
          </div>
          <div>
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" name="numero" value={formData.endereco?.numero || ""} onChange={manipularMudancaEndereco} disabled={camposDesabilitados} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" name="complemento" value={formData.endereco?.complemento} onChange={manipularMudancaEndereco} disabled={camposDesabilitados} />
          </div>
          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" name="bairro" value={formData.endereco?.bairro || ""} onChange={manipularMudancaEndereco} disabled={camposDesabilitados} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" name="cidade" value={formData.endereco?.cidade || ""} onChange={manipularMudancaEndereco} disabled={camposDesabilitados} />
          </div>
          <div>
            <Label htmlFor="estado">Estado (UF)</Label>
            <Input id="estado" name="estado" value={formData.endereco?.estado || ""} onChange={manipularMudancaEndereco} maxLength={2} placeholder="Ex: SP" disabled={camposDesabilitados} />
          </div>
        </div>
      </fieldset>

      {formData.tipoDocumento === "CNPJ" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cnaeFiscal">CNAE Fiscal Principal</Label>
            <Input id="cnaeFiscal" name="cnaeFiscal" value={formData.cnaeFiscal} onChange={manipularMudanca} disabled={camposDesabilitados} />
          </div>
          <div>
            <Label htmlFor="cnaeFiscalDescricao">Descrição CNAE</Label>
            <Input id="cnaeFiscalDescricao" name="cnaeFiscalDescricao" value={formData.cnaeFiscalDescricao} onChange={manipularMudanca} disabled={camposDesabilitados} />
          </div>
        </div>
      )}

      {/* Tipo de Cadastro (Cliente/Fornecedor) */}
      <div className="space-y-2">
        <Label>Tipo de Cadastro</Label>
        <div className="flex items-center space-x-2">
          <Checkbox id="ehCliente" checked={formData.ehCliente} onCheckedChange={() => manipularMudancaCheckbox("ehCliente")} disabled={camposDesabilitados} />
          <Label htmlFor="ehCliente" className="font-normal">É Cliente</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="ehFornecedor" checked={formData.ehFornecedor} onCheckedChange={() => manipularMudancaCheckbox("ehFornecedor")} disabled={camposDesabilitados} />
          <Label htmlFor="ehFornecedor" className="font-normal">É Fornecedor</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={manipularMudanca} disabled={camposDesabilitados} />
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={buscandoCNPJ || camposDesabilitados}>{estaEditando ? "Salvar Alterações" : "Adicionar"}</Button>
      </div>
    </form>
  );
};