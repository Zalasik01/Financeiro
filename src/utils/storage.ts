/**
 * Utilitários para gerenciar o localStorage da aplicação
 */

// Chaves do localStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  USER_EMAIL: "finance_app_user_email",
  SELECTED_BASE: "finance_app_selected_base",
  USER_SESSION: "finance_app_user_session",
} as const;

// Tipos para os dados armazenados
export interface StoredUserSession {
  email: string;
  uid: string;
  isAdmin: boolean;
  displayName?: string;
  photoURL?: string;
}

export interface StoredBaseInfo {
  id: string;
  name: string;
  numberId?: string;
  ativo: boolean;
}

/**
 * Utilitário genérico para localStorage
 */
class LocalStorageManager {
  /**
   * Salva um valor no localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Erro ao salvar no localStorage (${key}):`, error);
    }
  }

  /**
   * Recupera um valor do localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Erro ao ler do localStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * Remove um item do localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover do localStorage (${key}):`, error);
    }
  }

  /**
   * Limpa todos os dados relacionados à aplicação
   */
  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error);
    }
  }

  /**
   * Verifica se o localStorage está disponível
   */
  isAvailable(): boolean {
    try {
      const test = "localStorage_test";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Instância singleton do gerenciador
export const storage = new LocalStorageManager();

/**
 * Funções específicas para gerenciar dados da aplicação
 */

// Gerenciamento do Access Token
export const accessToken = {
  set: (token: string) => storage.set(STORAGE_KEYS.ACCESS_TOKEN, token),
  get: () => storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  remove: () => storage.remove(STORAGE_KEYS.ACCESS_TOKEN),
};

// Gerenciamento da sessão do usuário
export const userSession = {
  set: (session: StoredUserSession) =>
    storage.set(STORAGE_KEYS.USER_SESSION, session),
  get: () => storage.get<StoredUserSession>(STORAGE_KEYS.USER_SESSION),
  remove: () => storage.remove(STORAGE_KEYS.USER_SESSION),
};

// Gerenciamento da base selecionada
export const selectedBase = {
  set: (base: StoredBaseInfo) => storage.set(STORAGE_KEYS.SELECTED_BASE, base),
  get: () => storage.get<StoredBaseInfo>(STORAGE_KEYS.SELECTED_BASE),
  remove: () => storage.remove(STORAGE_KEYS.SELECTED_BASE),
};

// Gerenciamento do email do usuário (para persistir login)
export const userEmail = {
  set: (email: string) => storage.set(STORAGE_KEYS.USER_EMAIL, email),
  get: () => storage.get<string>(STORAGE_KEYS.USER_EMAIL),
  remove: () => storage.remove(STORAGE_KEYS.USER_EMAIL),
};

/**
 * Função para limpar toda a sessão
 */
export const clearSession = () => {
  accessToken.remove();
  userSession.remove();
  selectedBase.remove();
  // Mantém o email para facilitar próximo login
};

/**
 * Função para limpar tudo (incluindo email)
 */
export const clearAll = () => {
  storage.clear();
};

/**
 * Função para verificar se há uma sessão válida
 */
export const hasValidSession = (): boolean => {
  const token = accessToken.get();
  const session = userSession.get();
  return !!(token && session);
};
