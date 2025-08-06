import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "financeiro-app",
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Função para retry de operações
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Se for erro 5xx (server error), tenta novamente
      const isServerError =
        lastError.message?.includes("503") ||
        lastError.message?.includes("502") ||
        lastError.message?.includes("500") ||
        lastError.message?.includes("Service Unavailable");

      if (isServerError && attempt < maxRetries) {
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }

      // Para outros erros ou última tentativa, lança o erro
      throw lastError;
    }
  }

  throw lastError!;
};
