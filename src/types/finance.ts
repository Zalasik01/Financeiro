
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  discount?: number;
  categoryId: string;
  date: Date;
  type: 'income' | 'expense';
  category?: Category;
  createdAt: Date;
}

export interface FinancialSummary {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  startDate: Date | null;
  endDate: Date | null;
}
