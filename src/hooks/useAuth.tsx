import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
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
import { db } from "@/firebase"; // Importar db do RTDB
import {
  ref as databaseRef,
  set as databaseSet,
  get as databaseGet,
  serverTimestamp, // Importar serverTimestamp
} from "firebase/database"; // Funções do RTDB
import { useToast } from "./use-toast";

interface AppUser extends User {
  isAdmin?: boolean;
  clientBaseId?: number | null; // No perfil do usuário, este será o numberId da ClientBase
}

interface AuthContextType {
  currentUser: AppUser | null; // Modificado para AppUser
  loading: boolean;
  error: string | null; // Adicionar estado de erro
  signup: (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string | null,
    inviteClientBaseUUID?: string | null,
    inviteClientBaseNumberId?: number | null
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
  selectedBaseId: string | null; // Adicionar selectedBaseId
  setSelectedBaseId: (baseId: string | null) => void; // Adicionar setter para selectedBaseId
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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null); // Modificado para AppUser
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro
  const [_selectedBaseId, _setSelectedBaseId] = useState<string | null>(null); // Estado para a base selecionada
  const setSelectedBaseId = (baseId: string | null) => {    
    _setSelectedBaseId(baseId);
  };
  const { toast } = useToast();

  // Ref para rastrear se um login acabou de ser concluído
  const hasJustLoggedInRef = useRef(false); 

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string | null,
    inviteClientBaseUUID?: string | null,
    inviteClientBaseNumberId?: number | null
  ) => {
    try {
      setError(null); // Limpa erros anteriores
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        // Definir adminModalDismissed como true AQUI, logo após a criação do usuário no Auth,
        // para que o useEffect no AppContent não abra o modal imediatamente.
        sessionStorage.setItem("adminModalDismissed", "true");

        // displayName é agora obrigatório
        await updateProfile(userCredential.user, { displayName });
        const newUserUID = userCredential.user.uid;
        // Salvar dados adicionais do usuário no RTDB, incluindo a flag isAdmin
        const userProfileRef = databaseRef(
          db,
          `users/${userCredential.user.uid}/profile` // Nó para perfil
        );
        await databaseSet(userProfileRef, {
          email: userCredential.user.email,
          displayName: displayName,
          uid: newUserUID,
          isAdmin: email === "nizalasik@gmail.com", // Define isAdmin - idealmente isso seria gerenciado de outra forma
          clientBaseId: inviteClientBaseNumberId ?? null, // Vincula ao numberId da base do convite
          createdAt: serverTimestamp(), // Adiciona timestamp de criação do perfil
        });

        // Se o cadastro veio de um convite válido, vincular usuário à base e atualizar convite
        if (
          inviteToken &&
          inviteClientBaseUUID &&
          inviteClientBaseNumberId !== null &&
          inviteClientBaseNumberId !== undefined
        ) {
          // 1. Adicionar UID do usuário à base
          const authorizedUIDRef = databaseRef(
            db,
            `clientBases/${inviteClientBaseUUID}/authorizedUIDs/${newUserUID}`
          );
          await databaseSet(authorizedUIDRef, true);

          // 2. Marcar convite como usado
          const inviteStatusRef = databaseRef(
            db,
            `invites/${inviteToken}/status`
          );
          await databaseSet(inviteStatusRef, "used");
          // Opcional: Adicionar usedBy: newUserUID, usedAt: serverTimestamp() ao convite
          // Opcional: Remover o nó do convite após o uso bem-sucedido
        }
      }
      const description = "Bem-vindo(a)! " + displayName;
      toast({
        title: "Bem vindo(a)!",
        description,
        variant: "success",
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
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "O formato do e-mail fornecido é inválido.";
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
      // Limpar a flag do modal para garantir que ele seja exibido para o admin no login
      sessionStorage.removeItem("adminModalDismissed");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        hasJustLoggedInRef.current = true; 
      }
      // O toast "Bem-vindo(a) de volta!" será tratado pelo useEffect abaixo
      return userCredential.user;
    } catch (err) {
      hasJustLoggedInRef.current = false; 
      const error = err as AuthError;
      const errorMessage =
        error.code === "auth/invalid-credential"
          ? "Credenciais inválidas. Verifique seu e-mail e senha."
          : error.code === "auth/invalid-email"
          ? "O formato do e-mail fornecido é inválido."
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
      sessionStorage.removeItem("adminModalDismissed"); // Limpa a flag do modal admin
      hasJustLoggedInRef.current = false; 
      setSelectedBaseId(null); 
      await signOut(auth);
      const description = "Usuário deslogado com sucesso!";
      toast({
        title: "Logout realizado",
        description,
        variant: "success",
      });
    } catch (err) { // Corrigido para usar err como nome da variável de erro
      // Não costuma dar erro, mas se der:
      const authError = err as AuthError; // Tipar o erro
      const errorMessage = authError.message || "Não foi possível fazer logout.";
      setError(errorMessage);
      toast({
        title: "Erro no logout",
        description: errorMessage, // Usar errorMessage aqui
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
      if (user) {
        const userProfileRef = databaseRef(db, `users/${user.uid}/profile`);
        databaseGet(userProfileRef)
          .then((snapshot) => {
            let isAdmin = false; // Define um valor padrão
            let userClientBaseId: string | null = null;

            if (snapshot.exists()) {
              const profileData = snapshot.val();
              isAdmin = profileData.isAdmin === true;
              userClientBaseId =
                typeof profileData.clientBaseId === "number"
                  ? profileData.clientBaseId
                  : null;
            } else {
            }
            // Armazena o numberId no currentUser.clientBaseId
            setCurrentUser({
              ...user,
              isAdmin,
              clientBaseId: userClientBaseId,
            });
            // selectedBaseId (UUID) será definido em AppContent
            setSelectedBaseId(null); // Inicializa como null, AppContent resolverá            
          })
          .catch((error) => {
            console.error("Erro ao buscar perfil do usuário no RTDB:", error);
            // Em caso de erro ao buscar perfil, define isAdmin como false para o usuário atual
            setCurrentUser({ ...user, isAdmin: false });
            setSelectedBaseId(null);
          })
          .finally(() => {
            // setLoading(false) é chamado aqui, garantindo que seja após a tentativa de buscar o perfil
            setLoading(false);
          });
      } else {
        setCurrentUser(null);
        setLoading(false);
        setSelectedBaseId(null);
        hasJustLoggedInRef.current = false; 
      }
    });
    return unsubscribe;
  }, []);

  // Efeito para exibir o toast "Bem-vindo(a) de volta!" após o login e seleção da base
  useEffect(() => {
    if (
      hasJustLoggedInRef.current &&
      currentUser &&
      _selectedBaseId 
    ) {
      toast({
        title: `Bem-vindo(a) de volta!`,
        description: currentUser.displayName || "Usuário", // Usa displayName ou um fallback
        variant: "success",
      });
      hasJustLoggedInRef.current = false; 
    }
  }, [currentUser, _selectedBaseId, toast]);

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
    selectedBaseId: _selectedBaseId, // Expor selectedBaseId
    setSelectedBaseId, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
