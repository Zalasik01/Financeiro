import { Store, PaymentMethod, MovementType } from "@/types/store";

export const defaultStores: Store[] = [
  {
    id: "1",
    name: "Loja A",
    cnpj: "12345678901234",
    nickname: "Loja Central",
    code: "001",
    icon: "🏠",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Loja B",
    cnpj: "98765432109876",
    nickname: "Filial",
    code: "002",
    icon: "🏠",
    createdAt: new Date(),
  },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    name: "Dinheiro",
    type: "cash",
    color: "#10B981",
    icon: "💵",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Cartão Débito",
    type: "card",
    color: "#3B82F6",
    icon: "💳",
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Cartão Crédito",
    type: "card",
    color: "#8B5CF6",
    icon: "💳",
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "PIX",
    type: "pix",
    color: "#06B6D4",
    icon: "📱",
    createdAt: new Date(),
  },
];

export const defaultMovementTypes: MovementType[] = [
  {
    id: "1",
    name: "Vendas",
    category: "entrada",
    color: "#10B981",
    icon: "🛒",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Fornecedores",
    category: "saida",
    color: "#EF4444",
    icon: "📦",
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Despesas Operacionais",
    category: "saida",
    color: "#F59E0B",
    icon: "🏢",
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Transferências",
    category: "outros",
    color: "#6B7280",
    icon: "🔄",
    createdAt: new Date(),
  },
];

// Você pode adicionar mais dados padrão aqui, como
// defaultClosings, defaultGoals, etc.
