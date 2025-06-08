export interface Category {
  id: string;
  name: string;
  type: "Receita" | "Despesa"; // Padronizado
  color: string;
  icon: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  discount?: number;
  categoryId: string;
  date: Date;
  type: "Receita" | "Despesa"; // Padronizado
  category?: Category;
  storeId?: string;
  createdAt: Date;
  updatedAt?: Date;]
  updatedBy?: string;
}

export interface FinancialSummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  transactionCount: number;
  startDate: Date | null;
  endDate: Date | null;
}
