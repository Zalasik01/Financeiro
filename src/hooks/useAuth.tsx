// importação removida: use integração Supabase se necessário
import type { ClientBase } from "@/types/store";
import { handleError } from "@/utils/errorHandler";
import {
  AuthError,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  get as databaseGet,
  ref as databaseRef,
  set as databaseSet,
  update as databaseUpdate,
} from "firebase/database";
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
// Importar utilitários do localStorage
import {
  accessToken,
  clearSession,
  selectedBase,
  userEmail,
  userSession,
  type StoredBaseInfo,
  type StoredUserSession,
} from "@/utils/storage";

interface AppUser extends User {
  isAdmin?: boolean;
  clientBaseId?: number | null;
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
  ) => Promise<User | null>;
  login: (email: string, password: string) => Promise<User | null>;
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
  hasJustLoggedInRef: React.MutableRefObject<boolean>; // <- Adicionar esta linha
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
      if (!auth.currentUser) {
        _setSelectedBaseId(null);
        return;
      }
      const localStorageKey = getLocalStorageKeyForSelectedBase(
        auth.currentUser.uid
      );

      if (!baseId) {
        localStorage.removeItem(localStorageKey);
        _setSelectedBaseId(null);
        return;
      }

      try {
        const baseDataRef = databaseRef(db, `clientBases/${baseId}`);
        const snapshot = await databaseGet(baseDataRef);

        if (!snapshot.exists()) {
          toast({
            title: "Erro",
            description: "A base selecionada não foi encontrada.",
            variant: "destructive",
          });
          localStorage.removeItem(localStorageKey);
          _setSelectedBaseId(null);
          return;
        }

        const baseData = snapshot.val() as ClientBase;
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
    [toast, getLocalStorageKeyForSelectedBase]
  );

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string,
    inviteClientBaseUUID?: string | null,
    inviteClientBaseNumberId?: number | null,
    isAdminOverride?: boolean
  ) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      toast({
        title: "Bem vindo(a)!",
        description: `Bem-vindo(a)! ${displayName}`,
        variant: "success",
      });
      return userCredential.user;
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

  const login = async (email: string, password: string) => {
    try {
      setError(null);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        hasJustLoggedInRef.current = true;

        // Salvar email do usuário no localStorage
        userEmail.set(email);

        // Gerar/obter access token (usando o token do Firebase)
        const token = await userCredential.user.getIdToken();
        accessToken.set(token);
      }
      return userCredential.user;
    } catch (err) {
      hasJustLoggedInRef.current = false;
      const error = err as AuthError;
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
      const currentUid = auth.currentUser?.uid;
      await signOut(auth);
      _setSelectedBaseId(null);

      // Limpar dados do localStorage (mantém o email para facilitar próximo login)
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
      const authError = err as AuthError;
      const errorMessage =
        authError.message || "Não foi possível fazer logout.";
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
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage =
        authError.message || "Não foi possível enviar o e-mail.";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Função para sincronizar UIDs do usuário nas bases autorizadas
  const syncUserUIDInBases = async (user: User) => {
    try {
      console.log(
        "🔄 [useAuth] Iniciando sincronização de UID para bases autorizadas:",
        {
          uid: user.uid,
          email: user.email,
        }
      );

      // Buscar todas as bases
      const basesRef = databaseRef(db, "clientBases");
      const basesSnapshot = await databaseGet(basesRef);

      if (!basesSnapshot.exists()) {
        console.log("📭 [useAuth] Nenhuma base encontrada para sincronização");
        return;
      }

      const bases = basesSnapshot.val();

      for (const baseId in bases) {
        const base = bases[baseId];
        const authorizedUIDs = base.authorizedUIDs || {};

        // Verificar se há algum UID autorizado com o mesmo email do usuário atual
        let foundMatchingEmail = false;
        let uidsToRemove: string[] = [];

        for (const uid in authorizedUIDs) {
          const userData = authorizedUIDs[uid];
          if (userData.email === user.email) {
            foundMatchingEmail = true;
            if (uid !== user.uid) {
              // UID diferente mas mesmo email - precisa atualizar
              uidsToRemove.push(uid);
              console.log(
                "🔄 [useAuth] UID antigo encontrado para sincronização:",
                {
                  baseId,
                  baseName: base.name,
                  oldUID: uid,
                  newUID: user.uid,
                  email: user.email,
                }
              );
            }
          }
        }

        if (foundMatchingEmail) {
          // Remover UIDs antigos e adicionar o novo
          const updates: any = {};

          // Remover UIDs antigos
          uidsToRemove.forEach((oldUID) => {
            updates[`/clientBases/${baseId}/authorizedUIDs/${oldUID}`] = null;
          });

          // Adicionar UID atual se não existir ou foi removido
          if (uidsToRemove.length > 0 || !authorizedUIDs[user.uid]) {
            updates[`/clientBases/${baseId}/authorizedUIDs/${user.uid}`] = {
              displayName:
                user.displayName || user.email?.split("@")[0] || "Usuário",
              email: user.email,
            };
          }

          if (Object.keys(updates).length > 0) {
            await databaseUpdate(databaseRef(db), updates);
            console.log(
              "✅ [useAuth] UIDs sincronizados com sucesso na base:",
              {
                baseId,
                baseName: base.name,
                removedUIDs: uidsToRemove,
                newUID: user.uid,
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ [useAuth] Erro ao sincronizar UIDs:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("🔐 [useAuth] onAuthStateChanged:", {
        hasUser: !!user,
        userEmail: user?.email,
        timestamp: new Date().toISOString(),
      });

      if (user) {
        const userProfileRef = databaseRef(db, `users/${user.uid}/profile`);
        // Sincronizar UIDs nas bases autorizadas antes de carregar perfil
        syncUserUIDInBases(user).finally(() => {
          databaseGet(userProfileRef)
            .then((snapshot) => {
              const appUser: AppUser = {
                ...user,
                isAdmin: false,
                clientBaseId: null,
              };
              if (snapshot.exists()) {
                const profileData = snapshot.val();
                console.log("🔧 [useAuth] Dados do perfil encontrados:", {
                  uid: user.uid,
                  email: user.email,
                  profileData,
                  isAdminValue: profileData.isAdmin,
                  isAdminCheck: profileData.isAdmin === true,
                });

                appUser.isAdmin = profileData.isAdmin === true;
                appUser.clientBaseId =
                  typeof profileData.clientBaseId === "number"
                    ? profileData.clientBaseId
                    : null;
              } else {
                // Usuário não encontrado na coleção users - criar perfil básico
                console.log(
                  "⚠️ [useAuth] Usuário não encontrado na coleção users - criando perfil básico"
                );

                // Criar perfil básico para o usuário
                const basicProfile = {
                  email: user.email,
                  displayName:
                    user.displayName || user.email?.split("@")[0] || "Usuário",
                  isAdmin: false,
                  clientBaseId: null,
                  createdAt: Date.now(),
                };

                const userProfileRef = databaseRef(
                  db,
                  `users/${user.uid}/profile`
                );
                databaseSet(userProfileRef, basicProfile)
                  .then(() => {
                    console.log(
                      "✅ [useAuth] Perfil básico criado com sucesso"
                    );
                  })
                  .catch((error) => {
                    console.warn(
                      "⚠️ [useAuth] Erro ao criar perfil básico:",
                      error
                    );
                  });
              }

              // Salvar sessão do usuário no localStorage
              const sessionData: StoredUserSession = {
                email: user.email || "",
                uid: user.uid,
                isAdmin: appUser.isAdmin || false,
                displayName: user.displayName || undefined,
                photoURL: user.photoURL || undefined,
              };
              userSession.set(sessionData);

              setCurrentUser(appUser);
              const lastSelectedBaseId = localStorage.getItem(
                getLocalStorageKeyForSelectedBase(user.uid)
              );
              if (lastSelectedBaseId) {
                setSelectedBaseId(lastSelectedBaseId);
              }

              console.log("✅ [useAuth] Usuário configurado com sucesso:", {
                uid: user.uid,
                email: user.email,
                isAdmin: appUser.isAdmin,
                clientBaseId: appUser.clientBaseId,
              });
            })
            .catch((error) => {
              console.error(
                "❌ [useAuth] Erro ao buscar perfil do usuário:",
                error
              );
              // Mesmo com erro, definir o usuário com dados básicos
              setCurrentUser({ ...user, isAdmin: false, clientBaseId: null });
            })
            .finally(() => {
              console.log("🏁 [useAuth] Finalizando carregamento do usuário");
              setLoading(false);
            });
        });
      } else {
        // Limpar localStorage quando não há usuário autenticado
        console.log("🚪 [useAuth] Usuário deslogado - limpando sessão");
        clearSession();
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [setSelectedBaseId]);

  // Funções de perfil (implementação básica)
  const updateUserProfileData = async (updates: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!currentUser) throw new Error("Usuário não autenticado");
    await updateProfile(currentUser, updates);
  };

  const uploadProfilePhotoAndUpdateURL = async (file: File) => {
    // Implementação futura para upload de foto
    console.log(
      "📸 [useAuth] Upload de foto não implementado ainda:",
      file.name
    );
  };

  const removeProfilePhoto = async () => {
    // Implementação futura para remoção de foto
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
