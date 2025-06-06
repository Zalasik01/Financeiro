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
import type { ClientBase } from "@/types/store"; // Importar ClientBase

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
    inviteClientBaseNumberId?: number | null,
    isAdminOverride?: boolean // Novo parâmetro
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
  setSelectedBaseId: (baseId: string | null) => Promise<void>; // Modificado para Promise<void>
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
  const { toast } = useToast();

  const setSelectedBaseId = useCallback(async (baseId: string | null): Promise<void> => {
    // currentUser é uma dependência implícita aqui, mas como está no escopo do provider,
    // e o hook useAuth garante que o contexto existe, não precisamos passá-lo explicitamente
    // para o useCallback se a lógica interna não depender de uma versão específica dele que muda.
    // No entanto, se currentUser fosse usado para algo mais do que uma verificação de existência,
    // e essa verificação precisasse da versão mais recente, ele deveria ser uma dependência.
    // Para este caso, a lógica atual parece segura sem currentUser no array de dependências do useCallback.
    // A função toast também é estável.
    if (!auth.currentUser) { // Usar auth.currentUser para a verificação mais direta
      _setSelectedBaseId(null);
      return;
    }
    if (!baseId) {
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
        _setSelectedBaseId(null);
        return;
      }

      const baseData = snapshot.val() as ClientBase;
      if (!baseData.ativo) {
        toast({
          title: "Acesso Bloqueado",
          description: `A base "${baseData.name}" está temporariamente inativa. Motivo: ${baseData.motivo_inativo || "Não especificado."}`,
          variant: "destructive",
        });
        _setSelectedBaseId(null); // Não define a base se estiver inativa
        return;
      }
      // Base está ativa e existe
      _setSelectedBaseId(baseId);
    } catch (err) {
      console.error("Erro ao verificar status da base:", err);
      toast({ title: "Erro ao Acessar Base", description: "Não foi possível verificar o status da base selecionada.", variant: "destructive" });
      _setSelectedBaseId(null);
    }
  }, [toast]); // currentUser e toast são dependências. toast é estável.

  // Ref para rastrear se um login acabou de ser concluído
  const hasJustLoggedInRef = useRef(false); 

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string | null,
    inviteClientBaseUUID?: string | null,
    inviteClientBaseNumberId?: number | null,
    isAdminOverride?: boolean // Novo parâmetro
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

        // Atualizar o perfil no Firebase Auth (displayName, photoURL etc.)
        await updateProfile(userCredential.user, { displayName });
        // const newUserUID = userCredential.user.uid;
        
        // A CRIAÇÃO DO PERFIL NO REALTIME DATABASE SERÁ MOVIDA
        // PARA UMA CLOUD FUNCTION CHAMADA PELO ADMIN
        // Exemplo de como era antes (agora removido daqui):
        // const userProfileRef = databaseRef(db, `users/${newUserUID}/profile`);
        // await databaseSet(userProfileRef, {
        //   email: userCredential.user.email,
        //   displayName: displayName,
        //   uid: newUserUID,
        //   isAdmin: isAdminOverride === true ? true : (email === "nizalasik@gmail.com"),
        //   clientBaseId: isAdminOverride === true ? null : (inviteClientBaseNumberId ?? null),
        //   createdAt: serverTimestamp(),
        //   authDisabled: false,
        // });

        // A LÓGICA DE VINCULAR A UMA BASE VIA CONVITE TAMBÉM É REMOVIDA DAQUI
        // POIS ESTAVA ATRELADA AO AUTO-CADASTRO
        // if (
        //   isAdminOverride !== true &&
        //   inviteToken &&
        //   inviteClientBaseUUID &&
        //   inviteClientBaseNumberId !== null &&
        //   inviteClientBaseNumberId !== undefined
        // ) {
        //   const authorizedUIDRef = databaseRef(
        //     db,
        //     `clientBases/${inviteClientBaseUUID}/authorizedUIDs/${newUserUID}`
        //   );
        //   await databaseSet(authorizedUIDRef, {
        //     displayName: userCredential.user.displayName || "Usuário Convidado",
        //     email: userCredential.user.email || "email.nao.fornecido@example.com",
        //   });
        //   const inviteStatusRef = databaseRef(
        //     db,
        //     `invites/${inviteToken}/status`
        //   );
        //   await databaseSet(inviteStatusRef, "used");
        // }
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
          const oldPhotoRef = ref(storage, auth.currentUser.photoURL); // Corrigido para usar ref do storage
          await deleteObject(oldPhotoRef);
        } catch (deleteErrorUnknown: unknown) {
          const deleteError = deleteErrorUnknown as { message?: string };
          console.warn(
            "Falha ao remover foto antiga do storage durante o upload:",
            deleteError.message || deleteError
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
    } catch (errorUnknown: unknown) {
      const typedError = errorUnknown as { message?: string };
      const errMessage = typedError.message || "Não foi possível atualizar a foto de perfil.";
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
        } catch (deleteErrorUnknown: unknown) {
          const deleteError = deleteErrorUnknown as { message?: string };
          console.warn(
            "Falha ao remover foto do storage durante a remoção do perfil:",
            deleteError.message || deleteError
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
    } catch (errorUnknown: unknown) {
      const error = errorUnknown as { message?: string };
      const errMessage = error.message || "Não foi possível remover a foto de perfil.";
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
            let userClientBaseId: number | null = null;

            if (snapshot.exists()) {
              const profileData = snapshot.val();
              isAdmin = profileData.isAdmin === true;
              // No perfil, clientBaseId é o numberId da base
              userClientBaseId = 
                typeof profileData.clientBaseId === "number"
                  ? profileData.clientBaseId
                  : null;
              console.log("[useAuth] Perfil do usuário carregado:", { profileData, userClientBaseId }); // LOG ADICIONADO
            } // Fechamento do if (snapshot.exists())
            // Armazena o numberId no currentUser.clientBaseId
            setCurrentUser({
              ...user,
              isAdmin,
              clientBaseId: userClientBaseId,
            });
            // selectedBaseId (UUID) será definido em AppContent
            // setSelectedBaseId(null); // Comentado pois AppContent já lida com isso e pode causar loop se não memoizado corretamente
          })
          .catch((error) => {
            console.error("Erro ao buscar perfil do usuário no RTDB:", error);
            // Em caso de erro ao buscar perfil, define isAdmin como false para o usuário atual
            setCurrentUser({ ...user, isAdmin: false, clientBaseId: null });
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
  }, [setSelectedBaseId]); // Adicionado setSelectedBaseId

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
