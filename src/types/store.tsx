export interface Store {
  id: string;
  name: string;
  cnpj: string;
  nickname: string | null;
  code: string | null;
  icon: string;
  createdAt: Date; // Ou string, dependendo de como você armazena
  isDefault?: boolean;
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
  category: "entrada" | "saida" | "outros";
  color: string;
  icon: string;
  createdAt: Date;
}

export interface MovementItem {
  id: string;
  description: string;
  amount: number;
  discount?: number; // Campo de desconto opcional
  movementTypeId: string;
  paymentMethodId: string;
  movementType?: MovementType;
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
