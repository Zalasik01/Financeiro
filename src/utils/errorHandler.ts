export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const getAuthErrorMessage = (code: string): string => {
  const authErrors: Record<string, string> = {
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha é muito fraca. Use pelo menos 6 caracteres.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-disabled": "Esta conta foi desabilitada.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
    "auth/invalid-credential": "Credenciais inválidas.",
    "auth/requires-recent-login": "Esta operação requer login recente.",
  };

  return authErrors[code] || "Erro de autenticação não identificado.";
};

export const handleError = (error: unknown, context: string) => {
  console.error(`[${context}]`, error);

  // Verificar se é um erro do Firebase Auth

  if (error instanceof AppError) {
    return {
      message: error.message,
      type: "app" as const,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: "generic" as const,
    };
  }

  return {
    message: "Erro inesperado",
    type: "unknown" as const,
  };
};

// Função para retry com backoff exponencial
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffFactor: number = 2
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${attempt}/${maxRetries} falhou:`, error);

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
        console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
