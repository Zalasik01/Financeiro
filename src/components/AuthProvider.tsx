import { AuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient";
import type { ClientBase } from "@/types/store";
import { handleError } from "@/utils/errorHandler";
import {
  clearSession,
  selectedBase,
  userEmail,
  userSession,
  type StoredBaseInfo,
  type StoredUserSession,
} from "@/utils/storage";
import type { User } from "@supabase/supabase-js";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface AppUser {
  id: string;
  email: string;
  nome_exibicao?: string;
  admin?: boolean;
  id_base_padrao?: number | null;
  status?: string;
}

interface BaseAccessData {
  id_base_cliente: number;
  base_cliente: {
    id: number;
    nome: string;
    cnpj: string;
    ativa: boolean;
    limite_acesso: number;
    motivo_inativa: string;
    id_criador: number;
    criado_em: string;
    atualizado_em: string;
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientBases, setClientBases] = useState<ClientBase[]>([]);
  const [selectedClientBase, setSelectedClientBase] =
    useState<ClientBase | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  const authInitialized = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserClientBases = useCallback(async (): Promise<ClientBase[]> => {
    if (!currentUser) return [];

    try {
      const { data: accessData, error } = await supabase
        .from("acesso_usuario_base")
        .select(
          `
          id_base_cliente,
          base_cliente:id_base_cliente (
            id, nome, cnpj, ativa, limite_acesso, motivo_inativa, 
            id_criador, criado_em, atualizado_em
          )
        `
        )
        .eq("id_usuario", currentUser.id)
        .eq("status", "ativo");

      if (error) {
        console.error("Erro ao buscar bases do cliente:", error);
        return [];
      }

      const bases: ClientBase[] =
        (accessData as BaseAccessData[])?.map((access) => ({
          id: access.base_cliente.id,
          name: access.base_cliente.nome,
          cnpj: access.base_cliente.cnpj,
          active: access.base_cliente.ativa,
          accessLimit: access.base_cliente.limite_acesso,
          inactiveReason: access.base_cliente.motivo_inativa,
          createdBy: access.base_cliente.id_criador,
          createdAt: access.base_cliente.criado_em,
          updatedAt: access.base_cliente.atualizado_em,
        })) || [];

      setClientBases(bases);
      return bases;
    } catch (error) {
      console.error("Erro ao buscar bases do cliente:", error);
      handleError(error);
      return [];
    }
  }, [currentUser]);

  const loadUserData = useCallback(async (user: User) => {
    try {
      // Buscar dados do usuário na tabela usuario
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("*")
        .eq("email", user.email)
        .single();

      if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
        return;
      }

      if (userData) {
        const appUser: AppUser = {
          id: userData.id.toString(),
          email: userData.email,
          nome_exibicao: userData.nome_exibicao,
          admin: userData.admin,
          id_base_padrao: userData.id_base_padrao,
          status: userData.status,
        };

        setCurrentUser(appUser);

        // Salvar dados no localStorage
        const sessionData: StoredUserSession = {
          uid: userData.id.toString(),
          email: userData.email,
          displayName: userData.nome_exibicao || "",
          isAdmin: userData.admin || false,
          clientBaseId: userData.id_base_padrao,
        };

        userSession.set(sessionData);
        userEmail.set(userData.email);

        // Carregar base padrão se existir
        if (userData.id_base_padrao) {
          const { data: baseData } = await supabase
            .from("base_cliente")
            .select("*")
            .eq("id", userData.id_base_padrao)
            .single();

          if (baseData) {
            const defaultBase: ClientBase = {
              id: baseData.id,
              name: baseData.nome,
              cnpj: baseData.cnpj,
              active: baseData.ativa,
              accessLimit: baseData.limite_acesso,
              inactiveReason: baseData.motivo_inativa,
              createdBy: baseData.id_criador,
              createdAt: baseData.criado_em,
              updatedAt: baseData.atualizado_em,
            };

            setSelectedClientBase(defaultBase);
            const baseInfo: StoredBaseInfo = {
              id: defaultBase.id,
              name: defaultBase.name,
              cnpj: defaultBase.cnpj || "",
            };
            selectedBase.set(baseInfo);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      handleError(error);
    }
  }, []);

  const userCanAccess = useCallback(
    async (clientBaseId: number | null): Promise<boolean> => {
      if (!currentUser || !clientBaseId) return false;

      try {
        const { data, error } = await supabase
          .from("acesso_usuario_base")
          .select("id")
          .eq("id_usuario", currentUser.id)
          .eq("id_base_cliente", clientBaseId)
          .eq("status", "ativo")
          .single();

        return !error && !!data;
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        return false;
      }
    },
    [currentUser]
  );

  const getUserAccessLevel = useCallback(
    async (clientBaseId: number | null): Promise<string | null> => {
      if (!currentUser || !clientBaseId) return null;

      try {
        const { data, error } = await supabase
          .from("acesso_usuario_base")
          .select("status")
          .eq("id_usuario", currentUser.id)
          .eq("id_base_cliente", clientBaseId)
          .single();

        if (error) return null;
        return data?.status || null;
      } catch (error) {
        console.error("Erro ao obter nível de acesso:", error);
        return null;
      }
    },
    [currentUser]
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      inviteToken?: string | null,
      inviteClientBaseUUID?: string | null
    ) => {
      try {
        setError(null);
        setLoading(true);

        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
          }
        );

        if (authError) {
          throw authError;
        }

        if (authData.user) {
          // Criar registro na tabela usuario
          const { error: insertError } = await supabase.from("usuario").insert({
            email,
            nome_exibicao: displayName,
            admin: false,
            status: "ativo",
          });

          if (insertError) {
            throw insertError;
          }

          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta.",
          });
        }
      } catch (error: unknown) {
        console.error("Erro no cadastro:", error);
        const message =
          error instanceof Error ? error.message : "Erro ao criar conta";
        setError(message);
        toast({
          title: "Erro no cadastro",
          description: message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await loadUserData(data.user);
          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo de volta!`,
          });
        }
      } catch (error: unknown) {
        console.error("Erro no login:", error);
        const message =
          error instanceof Error ? error.message : "Erro ao fazer login";
        setError(message);
        toast({
          title: "Erro no login",
          description: message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadUserData, toast]
  );

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      setClientBases([]);
      setSelectedClientBase(null);
      setUserPermissions([]);
      clearSession();

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Erro no logout:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
          throw error;
        }

        toast({
          title: "Email enviado",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
      } catch (error: unknown) {
        console.error("Erro ao redefinir senha:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao enviar email de redefinição";
        setError(message);
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!currentUser) return;

      try {
        setError(null);

        const { error } = await supabase
          .from("usuario")
          .update({ nome_exibicao: name })
          .eq("id", currentUser.id);

        if (error) {
          throw error;
        }

        setCurrentUser({ ...currentUser, nome_exibicao: name });

        toast({
          title: "Nome atualizado",
          description: "Seu nome foi atualizado com sucesso.",
        });
      } catch (error: unknown) {
        console.error("Erro ao atualizar nome:", error);
        handleError(error);
        throw error;
      }
    },
    [currentUser, toast]
  );

  const refreshUserData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await loadUserData(data.user);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      handleError(error);
    }
  }, [currentUser, loadUserData]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return (
        userPermissions.includes(permission) || currentUser?.admin === true
      );
    },
    [userPermissions, currentUser]
  );

  // Monitorar mudanças de autenticação
  useEffect(() => {
    if (authInitialized.current) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);

      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setCurrentUser(null);
        setClientBases([]);
        setSelectedClientBase(null);
        setUserPermissions([]);
        clearSession();
      }

      setLoading(false);
    });

    authInitialized.current = true;

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateDisplayName,
    getUserClientBases,
    userCanAccess,
    getUserAccessLevel,
    clearError,
    clientBases,
    refreshUserData,
    selectedClientBase,
    setSelectedClientBase,
    hasPermission,
    userPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
