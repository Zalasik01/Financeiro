export interface ClientBase {
  id: string; // Firebase push ID (UUID)
  name: string;
  numberId: number;
  ativo: boolean;
  limite_acesso?: number | null;
  motivo_inativo?: string | null; // Novo campo para o motivo da inativação
  authorizedUIDs: { 
  [uid: string]: {
    displayName: string;
    email: string;
  };
};
  createdAt: number; // Timestamp (Firebase serverTimestamp)
  createdBy: string; // UID do admin
}

export interface Base {
  id: string; // Será "1", "2", "3", etc.
  name: string;
  numberId?: number
  createdAt: number; // Usaremos timestamp do Firebase
}
export interface Store {
  id: string; // ID gerado pelo Firebase (push key)
  baseId: string; // ID da Base à qual pertence ("1", "2", etc.)
  name: string;
  cnpj: string;
  nickname: string | null;
  code: string | null;
  icon: string;
  isDefault?: boolean; // Se esta loja é a padrão (pode ser global ou por base, manteremos global por enquanto)
  createdAt: number; // Usaremos timestamp do Firebase
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
