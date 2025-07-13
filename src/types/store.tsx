export interface ClientBase {
  id: string; // Firebase push ID (UUID)
  name: string;
  numberId: number;
  ativo: boolean;
  limite_acesso?: number | null;
  motivo_inativo?: string | null; // Novo campo para o motivo da inativação
  cnpj?: string; // CNPJ da loja principal
  responsaveis?: Responsavel[]; // Lista de responsáveis
  contrato?: ContratoData; // Informações do contrato
  modeloContrato?: ModeloContratoData; // Modelo de contrato
  anotacoes?: AnotacaoData[]; // Lista de anotações
  authorizedUIDs: {
    [uid: string]: {
      displayName: string;
      email: string;
    };
  };
  createdAt: number; // Timestamp (Firebase serverTimestamp)
  createdBy: string; // UID do admin
}

export interface ContratoData {
  valorMensal?: string;
  dataInicio?: string;
  dataVencimento?: string;
  prazoMeses?: string;
  observacoes?: string;
  modalidadePagamento?: string;
  diaVencimentoMensal?: string;
}

export interface ModeloContratoData {
  templateTitle: string;
  templateContent: string;
}

export interface AnotacaoData {
  id: string;
  texto: string;
  data: string;
  dataPersonalizada?: string;
}

export interface Responsavel {
  nome: string;
  telefone: string;
  email?: string;
  cargo?: string;
  isFinanceiro: boolean; // Responsável financeiro
  isSistema: boolean; // Responsável pelo sistema
  isContato?: boolean; // Contato principal
}

export interface Base {
  id: string; // Será "1", "2", "3", etc.
  name: string;
  numberId?: number;
  ativo: boolean;
  createdAt: number; // Usaremos timestamp do Firebase
}
export interface ContatoTelefone {
  id: string;
  tipo: string;
  numero: string;
  principal?: boolean;
}

export interface ContatoEmail {
  id: string;
  tipo: string;
  email: string;
  principal?: boolean;
}

export interface Store {
  id: string;
  baseId: string;
  name: string;
  cnpj: string;
  nickname: string | null;
  code: string | null;
  icon: string;
  isDefault?: boolean;
  isMatriz?: boolean;
  ativo?: boolean; // Campo ativo adicionado
  observacoes?: string; // Campo observações adicionado
  telefones?: ContatoTelefone[];
  emails?: ContatoEmail[];
  endereco?: {
    descricaoTipoLogradouro?: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  createdAt: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: "cash" | "card" | "pix" | "transfer" | "other";
  color: string;
  icon: string;
  createdAt: Date;
}

export interface MovementType {
  id: string;
  name: string;
  category: "Receita" | "Despesa" | "outros"; // Padronizar se MovementTypeManager ainda for usado para movimentações manuais
  color: string;
  icon: string;
  createdAt: Date;
}

export interface MovementItem {
  id: string;
  description: string;
  amount: number;
  discount?: number; // Campo de desconto opcional
  transactionType: "Receita" | "Despesa"; // Usaremos este para identificar o tipo
  paymentMethodId: string;
  updateAt?: Date; // Data de atualização opcional
  createdAt: Date;
  paymentMethod?: PaymentMethod;
}

export interface StoreClosing {
  id: string;
  storeId: string;
  store?: Store;
  closingDate: Date;
  initialBalance: number;
  finalBalance: number;
  movements: MovementItem[];
  totalEntradas: number;
  totalSaidas: number;
  totalOutros: number;
  netResult: number;
  createdAt: Date;
}

export interface DREData {
  period: string;
  stores: {
    store: Store;
    closings: StoreClosing[];
    totalReceitas: number;
    totalDespesas: number;
    resultadoLiquido: number;
    monthOverMonth?: number; // Diferença M/M
  }[];
  consolidated: {
    totalReceitas: number;
    totalDespesas: number;
    resultadoLiquido: number;
  };
}

export interface StoreMeta {
  id: string;
  storeId: string;
  month: number;
  year: number;
  targetRevenue: number;
  createdAt: Date;
}

export interface StoreRanking {
  store: Store;
  totalClosings: number;
  totalRevenue: number;
  totalExpenses: number;
  averageBalance: number;
  lastClosingDate?: Date;
}
