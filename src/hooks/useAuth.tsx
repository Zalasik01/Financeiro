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
      const description = "Bem-vindo(a)!";
      toast({
        title: "Cadastro realizado!",
        description,
      });
      return userCredential.user;
    } catch (error: AuthError) {
      console.error("Erro no cadastro:", error);
      let errorMessage = "Não foi possível criar a conta.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "Este e-mail já está cadastrado. Tente fazer login ou use um e-mail diferente.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      const description = errorMessage;
      toast({
        title: "Erro no cadastro",
        description,
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
      const description = "Bem-vindo(a) de volta!";
      toast({
        title: "Login realizado!",
        description,
      });
      return userCredential.user;
    } catch (error: AuthError) {
      console.error("Erro no login:", error);
      const errorMessage =
        error.code === "auth/invalid-credential"
          ? "Credenciais inválidas. Verifique seu e-mail e senha."
          : error.message || "Não foi possível fazer login.";
      const description = errorMessage;
      toast({
        title: "Erro no login",
        description,
        variant: "destructive",
      });
      return null;
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
      const description = "Usuário deslogado com sucesso!";
      toast({
        title: "Logout realizado",
        description,
      });
    } catch (error: AuthError) {
      const errorMessage = error.message || "Não foi possível fazer logout.";
      console.error("Erro no logout:", error);
      const description = errorMessage;
      toast({
        title: "Erro no logout",
        description,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      const description =
        "Verifique sua caixa de entrada para redefinir a senha.";
      toast({
        title: "E-mail enviado",
        description,
      });
    } catch (error: AuthError) {
      const errorMessage = error.message || "Não foi possível enviar o e-mail.";
      console.error("Erro ao enviar e-mail de redefinição de senha:", error);
      const description = errorMessage;
      toast({
        title: "Erro",
        description,
        variant: "destructive",
      });
    }
  };

  const updateUserProfileData = async (updates: {
    displayName?: string;
    photoURL?: string;
  }) => {
    if (!auth.currentUser) {
      const description = "Usuário não autenticado para atualizar o perfil.";
      toast({
        title: "Erro",
        description,
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
      const descriptionSuccess = "Perfil atualizado.";
      toast({
        title: "Sucesso!",
        description: descriptionSuccess,
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Erro ao atualizar perfil:", authError);
      const descriptionError =
        authError.message || "Não foi possível atualizar os dados do perfil.";
      toast({
        title: "Erro ao atualizar perfil",
        description: descriptionError,
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
