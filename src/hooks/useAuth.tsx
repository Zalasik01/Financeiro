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
import { auth, storage } from "@/firebase"; // Importar storage
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage"; // Importar funções do storage
import { useToast } from "./use-toast";
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null; // Adicionar estado de erro
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
    // Adicionar as novas funções ao tipo
  }) => Promise<void>;
  uploadProfilePhotoAndUpdateURL: (file: File) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
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
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro
  const { toast } = useToast();

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setError(null); // Limpa erros anteriores
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
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = "Não foi possível criar a conta.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "Este e-mail já está cadastrado. Tente fazer login ou use um e-mail diferente.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage); // Define o erro

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
      setError(null); // Limpa erros anteriores
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
    } catch (err) {
      const error = err as AuthError;
      const errorMessage =
        error.code === "auth/invalid-credential"
          ? "Credenciais inválidas. Verifique seu e-mail e senha."
          : error.message || "Não foi possível fazer login.";
      setError(errorMessage); // Define o erro
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
      setError(null); // Limpa erros anteriores
      await signOut(auth);
      const description = "Usuário deslogado com sucesso!";
      toast({
        title: "Logout realizado",
        description,
      });
    } catch (error: AuthError) {
      // Não costuma dar erro, mas se der:
      const errorMessage = error.message || "Não foi possível fazer logout.";
      setError(errorMessage);
      toast({
        title: "Erro no logout",
        description,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null); // Limpa erros anteriores
      await sendPasswordResetEmail(auth, email);
      const description =
        "Verifique sua caixa de entrada para redefinir a senha.";
      toast({
        title: "E-mail enviado",
        description,
      });
    } catch (error: AuthError) {
      setError(error.message || "Não foi possível enviar o e-mail.");
      const errorMessage = error.message || "Não foi possível enviar o e-mail.";
      const description = errorMessage; // Mantém para o toast
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
      setError("Usuário não autenticado para atualizar o perfil.");
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
      setError(null); // Limpa erros anteriores
      await updateProfile(auth.currentUser, updates);
      // Atualiza o estado local do currentUser para refletir as mudanças imediatamente
      // Usar 'updates' garante que o estado reflita o que foi enviado para atualização.
      setCurrentUser((prevUser) =>
        prevUser ? { ...prevUser, ...updates } : null
      );
      const descriptionSuccess = "Perfil atualizado.";
      toast({
        title: "Sucesso!",
        description: descriptionSuccess,
      });
    } catch (error) {
      const authError = error as AuthError;
      const descriptionError =
        authError.message || "Não foi possível atualizar os dados do perfil.";
      setError(descriptionError);
      toast({
        title: "Erro ao atualizar perfil",
        description: descriptionError,
        variant: "destructive",
      });
      throw authError; // Re-lança o erro para que o chamador possa lidar com ele se necessário
    }
  };

  const uploadProfilePhotoAndUpdateURL = async (file: File) => {
    if (!auth.currentUser) {
      const errMessage = "Usuário não autenticado para upload de foto.";
      setError(errMessage);
      toast({ title: "Erro", description: errMessage, variant: "destructive" });
      throw new Error(errMessage);
    }
    try {
      setError(null);
      // 1. Remover foto antiga do Storage se existir (opcional, mas bom para limpeza)
      if (auth.currentUser.photoURL) {
        try {
          const oldPhotoRef = ref(storage, auth.currentUser.photoURL);
          await deleteObject(oldPhotoRef);
        } catch (deleteError: any) {
          console.warn(
            "Falha ao remover foto antiga do storage durante o upload:",
            deleteError
          );
        }
      }

      // 2. Fazer upload da nova foto
      const filePath = `profilePictures/${auth.currentUser.uid}/${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const newPhotoURL = await getDownloadURL(storageRef);

      // 3. Atualizar photoURL no Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });

      // 4. Atualizar currentUser no estado do hook
      setCurrentUser((prevUser) =>
        prevUser ? { ...prevUser, photoURL: newPhotoURL } : null
      );

      toast({
        title: "Foto atualizada!",
        description: "Sua nova foto de perfil foi salva.",
      });
    } catch (error: any) {
      const errMessage =
        error.message || "Não foi possível atualizar a foto de perfil.";
      setError(errMessage);
      toast({
        title: "Erro no Upload",
        description: errMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeProfilePhoto = async () => {
    if (!auth.currentUser) {
      const errMessage = "Usuário não autenticado para remover foto.";
      setError(errMessage);
      toast({ title: "Erro", description: errMessage, variant: "destructive" });
      throw new Error(errMessage);
    }
    try {
      setError(null);
      // 1. Remover foto do Storage se existir
      if (auth.currentUser.photoURL) {
        try {
          const photoRef = ref(storage, auth.currentUser.photoURL);
          await deleteObject(photoRef);
        } catch (deleteError: any) {
          console.warn(
            "Falha ao remover foto do storage durante a remoção do perfil:",
            deleteError
          );
        }
      }
      // 2. Atualizar photoURL para null no Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: null });
      // 3. Atualizar currentUser no estado do hook
      setCurrentUser((prevUser) =>
        prevUser ? { ...prevUser, photoURL: null } : null
      );
      toast({
        title: "Foto removida!",
        description: "Sua foto de perfil foi removida.",
      });
    } catch (error: any) {
      const errMessage =
        error.message || "Não foi possível remover a foto de perfil.";
      setError(errMessage);
      toast({
        title: "Erro ao Remover Foto",
        description: errMessage,
        variant: "destructive",
      });
      throw error;
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
    error, // Expõe o erro
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfileData,
    uploadProfilePhotoAndUpdateURL, // Adicionar ao contexto
    removeProfilePhoto, // Adicionar ao contexto
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
