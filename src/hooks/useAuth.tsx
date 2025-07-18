import { supabase } from "@/supabaseClient";
import { handleError } from "@/utils/errorHandler";
import {
  accessToken,
  clearSession,
  selectedBase,
  userEmail,
  userSession,
  type StoredBaseInfo,
  type StoredUserSession,
} from "@/utils/storage";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useToast } from "./use-toast";

interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAdmin?: boolean;
  clientBaseId?: number | null;
  needsPasswordSetup?: boolean; // Indica se precisa definir senha
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signup: (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string | null,
    inviteClientBaseUUID?: string | null,
    inviteClientBaseNumberId?: number | null,
    isAdminOverride?: boolean
  ) => Promise<AppUser | null>;
  login: (email: string, password: string) => Promise<AppUser | null>;
  logout: (customMessage?: {
    title: string;
    description: string;
    variant?: "default" | "destructive" | "success";
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfileData: (updates: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
  uploadProfilePhotoAndUpdateURL: (file: File) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
  selectedBaseId: string | null;
  setSelectedBaseId: (baseId: string | null) => Promise<void>;
  hasJustLoggedInRef: React.MutableRefObject<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Durante o desenvolvimento com hot reload, pode haver momentos onde o contexto não está disponível
    console.warn(
      "⚠️ [useAuth] Contexto não encontrado - verificando se AuthProvider está configurado corretamente"
    );
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_selectedBaseId, _setSelectedBaseId] = useState<string | null>(null);
  const { toast } = useToast();
  const hasJustLoggedInRef = useRef(false);

  const getLocalStorageKeyForSelectedBase = useCallback(
    (uid: string) => `financeiroApp_lastSelectedBaseId_${uid}`,
    []
  );

  const setSelectedBaseId = useCallback(
    async (baseId: string | null): Promise<void> => {
      if (!currentUser) {
        _setSelectedBaseId(null);
        return;
      }
      const localStorageKey = getLocalStorageKeyForSelectedBase(currentUser.id);

      if (!baseId) {
        localStorage.removeItem(localStorageKey);
        _setSelectedBaseId(null);
        return;
      }

      try {
        // Buscar base no Supabase
        // baseId pode ser string (UUID) ou inteiro, mas o campo correto é id (int)
        let query = supabase.from("base_cliente").select("*");
        if (typeof baseId === "string" && baseId.length === 36) {
          // UUID
          query = query.eq("id", baseId);
        } else {
          // Inteiro
          query = query.eq("numberId", baseId);
        }
        const { data: baseData, error } = await query.single();

        if (error || !baseData) {
          toast({
            title: "Erro",
            description: "A base selecionada não foi encontrada.",
            variant: "destructive",
          });
          localStorage.removeItem(localStorageKey);
          _setSelectedBaseId(null);
          return;
        }

        if (!baseData.ativo) {
          toast({
            title: "Acesso Bloqueado",
            description: `A base "${baseData.name}" está temporariamente inativa.`,
            variant: "destructive",
          });
          localStorage.removeItem(localStorageKey);
          selectedBase.remove();
          _setSelectedBaseId(null);
          return;
        }

        // Salvar informações da base no localStorage
        const baseInfo: StoredBaseInfo = {
          id: baseId,
          name: baseData.name,
          numberId: baseData.numberId,
          ativo: baseData.ativo,
        };
        selectedBase.set(baseInfo);

        localStorage.setItem(localStorageKey, baseId);
        _setSelectedBaseId(baseId);
      } catch (err) {
        console.error("Erro ao verificar status da base:", err);
        toast({
          title: "Erro ao Acessar Base",
          description:
            "Não foi possível verificar o status da base selecionada.",
          variant: "destructive",
        });
        localStorage.removeItem(localStorageKey);
        _setSelectedBaseId(null);
      }
    },
    [currentUser, toast, getLocalStorageKeyForSelectedBase]
  );

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string,
    inviteClientBaseUUID?: string | null,
    inviteClientBaseNumberId?: number | null,
    isAdminOverride?: boolean
  ): Promise<AppUser | null> => {
    try {
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Criar perfil do usuário usando os campos corretos da tabela
        const { error: profileError } = await supabase.from("usuario").insert({
          email: data.user.email,
          nome: displayName,
          admin: isAdminOverride || false,
          idbasepadrao: inviteClientBaseNumberId,
        });

        if (profileError) {
          console.warn("Erro ao criar perfil do usuário:", profileError);
        }

        toast({
          title: "Bem vindo(a)!",
          description: `Bem-vindo(a)! ${displayName}`,
          variant: "success",
        });

        return {
          id: data.user.id,
          email: data.user.email || undefined,
          displayName,
          isAdmin: isAdminOverride || false,
          clientBaseId: inviteClientBaseNumberId || null,
        };
      }
      return null;
    } catch (err) {
      const errorInfo = handleError(err, "useAuth.signup");
      setError(errorInfo.message);
      toast({
        title: "Erro no cadastro",
        description: errorInfo.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AppUser | null> => {
    try {
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        hasJustLoggedInRef.current = true;

        // Salvar email do usuário no localStorage
        userEmail.set(email);

        // Salvar access token
        accessToken.set(data.session?.access_token || "");

        return {
          id: data.user.id,
          email: data.user.email || undefined,
          displayName: data.user.user_metadata?.display_name,
        };
      }
      return null;
    } catch (err) {
      hasJustLoggedInRef.current = false;
      const errorMessage =
        "Credenciais inválidas. Verifique seu e-mail e senha.";
      setError(errorMessage);
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
  };

  const logout = async (customMessage?: {
    title: string;
    description: string;
    variant?: "default" | "destructive" | "success";
  }) => {
    try {
      setError(null);
      hasJustLoggedInRef.current = false;
      const currentUid = currentUser?.id;

      await supabase.auth.signOut();
      _setSelectedBaseId(null);

      // Limpar dados do localStorage
      clearSession();

      if (currentUid) {
        localStorage.removeItem(getLocalStorageKeyForSelectedBase(currentUid));
      }

      toast({
        title: customMessage?.title || "Logout realizado",
        description:
          customMessage?.description || "Você foi desconectado com sucesso.",
        variant: customMessage?.variant || "success",
      });
    } catch (err) {
      const errorMessage = "Não foi possível fazer logout.";
      setError(errorMessage);
      toast({
        title: "Erro no logout",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    } catch (error) {
      const errorMessage = "Não foi possível enviar o e-mail.";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 [useAuth] onAuthStateChange:", {
        event,
        hasSession: !!session,
      });

      if (session?.user) {
        console.log("👤 [useAuth] Processando usuário:", session.user.id);

        // Buscar perfil do usuário - usando email já que não há campo uuid na tabela
        let profileData = null;
        let profileError = null;
        try {
          const { data, error, status } = await supabase
            .from("usuario")
            .select("*")
            .eq("email", session.user.email)
            .single();
          profileData = data;
          profileError = error;

          if (profileError) {
            console.log("⚠️ [useAuth] Erro ao buscar perfil:", {
              code: profileError.code,
              status,
              message: profileError.message,
            });
          } else {
            console.log("✅ [useAuth] Perfil encontrado:", profileData?.email);
          }
        } catch (err: unknown) {
          console.error("❌ [useAuth] Erro na consulta:", err);
          profileError = err as {
            code?: string;
            status?: number;
            message?: string;
          };
        }

        // Se não existir, cria o registro mínimo
        if (
          profileError &&
          (profileError.code === "PGRST116" || profileError.status === 406)
        ) {
          console.log(
            "🔧 [useAuth] Criando perfil de usuário para:",
            session.user.email
          );
          const { error: insertError } = await supabase.from("usuario").insert({
            email: session.user.email,
            nome:
              session.user.user_metadata?.nome ||
              session.user.user_metadata?.display_name ||
              session.user.email?.split("@")[0],
            admin: false,
          });

          if (!insertError) {
            console.log("✅ [useAuth] Perfil criado com sucesso");
            // Buscar novamente
            const { data } = await supabase
              .from("usuario")
              .select("*")
              .eq("email", session.user.email)
              .single();
            profileData = data;
          } else if (
            insertError.code === "23505" ||
            insertError.code === "409"
          ) {
            console.log(
              "⚠️ [useAuth] Usuário já existe, buscando perfil existente"
            );
            // Registro já existe, buscar novamente
            const { data } = await supabase
              .from("usuario")
              .select("*")
              .eq("email", session.user.email)
              .single();
            profileData = data;
          } else {
            console.error("❌ [useAuth] Erro ao criar perfil:", insertError);
          }
        }

        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || undefined,
          displayName:
            session.user.user_metadata?.nome ||
            session.user.user_metadata?.display_name ||
            profileData?.nome,
          isAdmin: profileData?.admin || false,
          clientBaseId: profileData?.idbasepadrao || null,
          needsPasswordSetup:
            session.user.user_metadata?.needs_password_setup === true,
        };

        // Salvar sessão do usuário no localStorage
        const sessionData: StoredUserSession = {
          email: session.user.email || "",
          uid: session.user.id,
          isAdmin: appUser.isAdmin || false,
          displayName: appUser.displayName,
          photoURL: appUser.photoURL,
        };
        userSession.set(sessionData);

        setCurrentUser(appUser);

        // Restaurar base selecionada
        const lastSelectedBaseId = localStorage.getItem(
          getLocalStorageKeyForSelectedBase(session.user.id)
        );
        if (lastSelectedBaseId) {
          setSelectedBaseId(lastSelectedBaseId);
        }
      } else {
        console.log("🚪 [useAuth] Usuário deslogado - limpando sessão");
        clearSession();
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSelectedBaseId, getLocalStorageKeyForSelectedBase]);

  // Funções de perfil (implementação básica)
  const updateUserProfileData = async (updates: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!currentUser) throw new Error("Usuário não autenticado");

    const { error } = await supabase.auth.updateUser({
      data: { display_name: updates.displayName },
    });

    if (error) throw error;
  };

  const uploadProfilePhotoAndUpdateURL = async (file: File) => {
    console.log(
      "📸 [useAuth] Upload de foto não implementado ainda:",
      file.name
    );
  };

  const removeProfilePhoto = async () => {
    console.log("🗑️ [useAuth] Remoção de foto não implementada ainda");
  };

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfileData,
    uploadProfilePhotoAndUpdateURL,
    removeProfilePhoto,
    selectedBaseId: _selectedBaseId,
    setSelectedBaseId,
    hasJustLoggedInRef,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
