import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  AuthError,
} from "firebase/auth";
import { auth, storage } from "@/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db } from "@/firebase";
import {
  ref as databaseRef,
  set as databaseSet,
  get as databaseGet,
  serverTimestamp,
} from "firebase/database";
import { useToast } from "./use-toast";
import type { ClientBase } from "@/types/store";

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
  logout: (customMessage?: { title: string; description: string, variant?: "default" | "destructive" | "success" }) => Promise<void>;
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

  const getLocalStorageKeyForSelectedBase = (uid: string) => `financeiroApp_lastSelectedBaseId_${uid}`;

  const setSelectedBaseId = useCallback(async (baseId: string | null): Promise<void> => {
    if (!auth.currentUser) {
      _setSelectedBaseId(null);
      return;
    }
    const localStorageKey = getLocalStorageKeyForSelectedBase(auth.currentUser.uid);

    if (!baseId) {
      localStorage.removeItem(localStorageKey);
      _setSelectedBaseId(null);
      return;
    }

    try {
      const baseDataRef = databaseRef(db, `clientBases/${baseId}`);
      const snapshot = await databaseGet(baseDataRef);

      if (!snapshot.exists()) {
        toast({ title: "Erro", description: "A base selecionada não foi encontrada.", variant: "destructive" });
        localStorage.removeItem(localStorageKey);
        _setSelectedBaseId(null);
        return;
      }

      const baseData = snapshot.val() as ClientBase;
      if (!baseData.ativo) {
        toast({ title: "Acesso Bloqueado", description: `A base "${baseData.name}" está temporariamente inativa.`, variant: "destructive" });
        localStorage.removeItem(localStorageKey);
        _setSelectedBaseId(null);
        return;
      }
      localStorage.setItem(localStorageKey, baseId);
      _setSelectedBaseId(baseId);
    } catch (err) {
      console.error("Erro ao verificar status da base:", err);
      toast({ title: "Erro ao Acessar Base", description: "Não foi possível verificar o status da base selecionada.", variant: "destructive" });
      localStorage.removeItem(localStorageKey);
      _setSelectedBaseId(null);
    }
  }, [toast]);

  const signup = async (email: string, password: string, displayName: string, isAdminOverride?: boolean) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      toast({ title: "Bem vindo(a)!", description: `Bem-vindo(a)! ${displayName}`, variant: "success" });
      return userCredential.user;
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = "Não foi possível criar a conta.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está cadastrado.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      }
      setError(errorMessage);
      toast({ title: "Erro no cadastro", description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        hasJustLoggedInRef.current = true;
      }
      return userCredential.user;
    } catch (err) {
      hasJustLoggedInRef.current = false;
      const error = err as AuthError;
      const errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
      setError(errorMessage);
      toast({ title: "Erro no login", description: errorMessage, variant: "destructive" });
      throw new Error(errorMessage);
    }
  };

  const logout = async (customMessage?: { title: string; description: string, variant?: "default" | "destructive" | "success" }) => {
    try {
      setError(null);
      hasJustLoggedInRef.current = false;
      const currentUid = auth.currentUser?.uid;
      await signOut(auth);
      _setSelectedBaseId(null);
      if (currentUid) {
        localStorage.removeItem(getLocalStorageKeyForSelectedBase(currentUid));
      }
      toast({
        title: customMessage?.title || "Logout realizado",
        description: customMessage?.description || "Você foi desconectado com sucesso.",
        variant: customMessage?.variant || "success",
      });
    } catch (err) {
      const authError = err as AuthError;
      const errorMessage = authError.message || "Não foi possível fazer logout.";
      setError(errorMessage);
      toast({ title: "Erro no logout", description: errorMessage, variant: "destructive" });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.message || "Não foi possível enviar o e-mail.";
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userProfileRef = databaseRef(db, `users/${user.uid}/profile`);
        databaseGet(userProfileRef).then((snapshot) => {
          let appUser: AppUser = { ...user, isAdmin: false, clientBaseId: null };
          if (snapshot.exists()) {
            const profileData = snapshot.val();
            appUser.isAdmin = profileData.isAdmin === true;
            appUser.clientBaseId = typeof profileData.clientBaseId === "number" ? profileData.clientBaseId : null;
          }
          setCurrentUser(appUser);
          const lastSelectedBaseId = localStorage.getItem(getLocalStorageKeyForSelectedBase(user.uid));
          if (lastSelectedBaseId) {
            setSelectedBaseId(lastSelectedBaseId);
          }
        }).catch((error) => {
          console.error("Erro ao buscar perfil do usuário:", error);
          setCurrentUser({ ...user, isAdmin: false, clientBaseId: null });
        }).finally(() => {
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [setSelectedBaseId]);

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    selectedBaseId: _selectedBaseId,
    setSelectedBaseId,
    hasJustLoggedInRef, // <- Adicionar esta linha ao objeto de valor
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};