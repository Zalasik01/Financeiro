import { supabase, withRetry } from "@/supabaseClient";
import { accessToken as storageAccessToken } from "@/utils/storage";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useToast } from "./use-toast";

interface AppUser {
  id: string;
  email: string;
  nome?: string;
  admin?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  // Verificar sessão atual na inicialização
  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setAccessToken(session.access_token);
          await loadUserData(session.user.id, session.user.email!);
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças na sessão
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAccessToken(session.access_token);
        await loadUserData(session.user.id, session.user.email!);
      } else {
        setCurrentUser(null);
        setAccessToken(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (uuid: string, email: string) => {
    try {
      const { data: userData, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("uuid", uuid)
        .eq("status", "ATIVO")
        .single();

      if (error || !userData) {
        console.error("Usuário não encontrado ou inativo:", error);
        await supabase.auth.signOut();
        return;
      }

      setCurrentUser({
        id: userData.uuid,
        email: userData.email,
        nome: userData.nome,
        admin: userData.admin,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      await supabase.auth.signOut();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Usar retry para operações de rede
      const result = await withRetry(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        return data;
      });

      if (result.user) {
        await loadUserData(result.user.id, result.user.email!);
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
        variant: "default",
      });
    } catch (error: unknown) {
      console.error("Erro no login:", error);

      let errorMessage = "Erro no login";
      let errorDescription = "Credenciais inválidas";

      if (error instanceof Error) {
        if (
          error.message?.includes("503") ||
          error.message?.includes("Service Unavailable")
        ) {
          errorMessage = "Serviço temporariamente indisponível";
          errorDescription = "Tente novamente em alguns instantes";
        } else if (error.message?.includes("fetch")) {
          errorMessage = "Erro de conexão";
          errorDescription = "Verifique sua conexão com a internet";
        } else if (error.message?.includes("Invalid login credentials")) {
          errorDescription = "Email ou senha incorretos";
        } else {
          errorDescription = error.message || "Erro desconhecido";
        }
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setAccessToken(null);

      // Remover access token do localStorage
      storageAccessToken.remove();

      toast({
        title: "Logout realizado",
        description: "Até logo!",
        variant: "default",
      });
    } catch (error: unknown) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro no logout",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await withRetry(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      });

      toast({
        title: "Email de recuperação enviado",
        description: "Verifique sua caixa de entrada e spam",
        variant: "default",
      });
    } catch (error: unknown) {
      console.error("Erro ao enviar email de recuperação:", error);

      let errorDescription = "Erro ao enviar email";
      if (error instanceof Error) {
        if (error.message?.includes("Email rate limit exceeded")) {
          errorDescription =
            "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        } else if (
          error.message?.includes("503") ||
          error.message?.includes("Service Unavailable")
        ) {
          errorDescription =
            "Serviço temporariamente indisponível, tente novamente";
        } else if (error.message?.includes("fetch")) {
          errorDescription = "Erro de conexão, verifique sua internet";
        } else {
          errorDescription = error.message || "Erro desconhecido";
        }
      }

      toast({
        title: "Erro na recuperação",
        description: errorDescription,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        accessToken,
        login,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
