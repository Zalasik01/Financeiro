export const APP_CONFIG = {
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
  validation: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxDescriptionLength: 500,
    minPasswordLength: 6,
    maxTransactionAmount: 1000000, // R$ 1.000.000
  },
  ui: {
    toastDuration: {
      success: 3000,
      error: 5000,
      warning: 4000,
      info: 3000,
    },
    debounceDelay: 300,
    animationDuration: 200,
    itemsPerPage: {
      transactions: 20,
      stores: 15,
      categories: 50,
    },
  },
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  storage: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
    maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
  },
  finance: {
    defaultCurrency: 'BRL',
    maxTransactionsPerBatch: 1000,
    maxCategoriesPerBase: 100,
  },
  features: {
    enableOfflineMode: true,
    enablePushNotifications: false,
    enableAnalytics: true,
    enableDebugMode: import.meta.env.DEV,
  },
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  admin: '/admin',
  profile: '/editar-perfil',
  categories: '/categorias',
  stores: '/gerenciar-lojas',
  transactions: '/transacoes',
  reports: '/relatorio-dre',
  closing: '/fechamento',
  goals: '/metas',
} as const;

export const MESSAGES = {
  loading: 'Carregando...',
  saving: 'Salvando...',
  deleting: 'Excluindo...',
  success: 'Operação realizada com sucesso!',
  error: 'Ocorreu um erro inesperado.',
  noData: 'Nenhum item encontrado.',
  unauthorized: 'Você não tem permissão para esta ação.',
  networkError: 'Erro de conexão. Verifique sua internet.',
} as const;

export const VALIDATION_RULES = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  cep: /^\d{5}-\d{3}$/,
} as const;
