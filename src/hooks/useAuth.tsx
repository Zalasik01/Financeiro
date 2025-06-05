import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
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
import { auth } from "@/firebase";
import { useToast } from "./use-toast";
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User | null>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfileData: (updates: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        // displayName é agora obrigatório
        await updateProfile(userCredential.user, { displayName });
      }
      toast({ title: "Cadastro realizado!", description: "Bem-vindo(a)!" });
      return userCredential.user;
    } catch (error: AuthError) {
      console.error("Erro no cadastro:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar a conta.",
        variant: "destructive",
      });
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      toast({
        title: "Login realizado!",
        description: "Bem-vindo(a) de volta!",
      });
      return userCredential.user;
    } catch (error: AuthError) {
      console.error("Erro no login:", error);
      const errorMessage =
        error.code === "auth/invalid-credential"
          ? "Credenciais inválidas. Verifique seu e-mail e senha."
          : error.message || "Não foi possível fazer login.";
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout realizado", description: "Até breve!" });
    } catch (error: AuthError) {
      const errorMessage = error.message || "Não foi possível fazer logout.";
      console.error("Erro no logout:", error);
      toast({
        title: "Erro no logout",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    } catch (error: AuthError) {
      const errorMessage = error.message || "Não foi possível enviar o e-mail.";
      console.error("Erro ao enviar e-mail de redefinição de senha:", error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateUserProfileData = async (updates: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!auth.currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado para atualizar o perfil.",
        variant: "destructive",
      });
      // Lançar um erro ou retornar pode ser apropriado dependendo de como você quer lidar com isso na UI
      throw new Error("Usuário não autenticado.");
    }
    try {
      await updateProfile(auth.currentUser, updates);
      // Atualiza o estado local do currentUser para refletir as mudanças imediatamente
      if (auth.currentUser) {
        setCurrentUser({ ...auth.currentUser }); // Cria uma nova referência para o objeto do usuário
      }
      toast({ title: "Sucesso!", description: "Perfil atualizado." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Erro ao atualizar perfil:", authError);
      toast({
        title: "Erro ao atualizar perfil",
        description:
          authError.message || "Não foi possível atualizar os dados do perfil.",
        variant: "destructive",
      });
      throw authError; // Re-lança o erro para que o chamador possa lidar com ele se necessário
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfileData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
