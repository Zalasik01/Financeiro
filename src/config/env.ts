const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL',
] as const;

export const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    const errorMessage = `❌ Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}\n\nVerifique seu arquivo .env e reinicie o servidor.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log('✅ Todas as variáveis de ambiente necessárias foram encontradas');
};

export const env = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Validar automaticamente quando o módulo for importado
try {
  validateEnvironment();
} catch (error) {
  console.error('Erro na validação do ambiente:', error);
  if (import.meta.env.PROD) {
    // Em produção, podemos querer mostrar uma página de erro personalizada
    throw error;
  }
}
