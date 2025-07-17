const requiredEnvVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
] as const;

export const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    const errorMessage = `❌ Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(
      ", "
    )}\n\nVerifique seu arquivo .env e reinicie o servidor.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log(
    "✅ Todas as variáveis de ambiente necessárias foram encontradas"
  );
};

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Validar automaticamente quando o módulo for importado
try {
  validateEnvironment();
} catch (error) {
  console.error("Erro na validação do ambiente:", error);
  if (import.meta.env.PROD) {
    // Em produção, podemos querer mostrar uma página de erro personalizada
    throw error;
  }
}
