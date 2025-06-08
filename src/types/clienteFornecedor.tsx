export interface ClienteFornecedor {
  id: string; // Identificador único gerado pelo Firebase
  nome: string; // Nome completo ou Razão Social
  tipoDocumento: "CPF" | "CNPJ" | "Outro"; // Tipo do documento principal
  numeroDocumento?: string; // Número do CPF, CNPJ ou outro identificador
  nomeFantasia?: string; // Adicionado para CNPJ
  // O campo 'nome' já serve para Razão Social, então 'razaoSocial' pode ser redundante.
  email?: string; // Endereço de e-mail
  telefone?: string; // Número de telefone
  endereco?: {
    descricaoTipoLogradouro?: string; // Ex: AVENIDA, RUA
    logradouro: string; // Adicionado logradouro que estava faltando na interface anterior
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string; // Sigla do estado, ex: SP
    cep: string;
  };
  cnaeFiscal?: string; // Adicionado para CNPJ
  cnaeFiscalDescricao?: string; // Adicionado para CNPJ
  ehCliente: boolean; // Indica se é um cliente
  ehFornecedor: boolean; // Indica se é um fornecedor
  observacoes?: string; // Campo para anotações adicionais
  dataCadastro: number; // Timestamp da data de criação
  dataAtualizacao?: number; // Timestamp da última atualização
}