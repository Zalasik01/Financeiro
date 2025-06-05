import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from './use-toast';
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<User | null>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
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

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      toast({ title: 'Cadastro realizado!', description: 'Bem-vindo(a)!' });
      return userCredential.user;
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível criar a conta.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logout realizado', description: 'Até breve!' });
    } catch (error: any) {
      const errorMessage = error.message || 'Não foi possível fazer logout.';
      console.error("Erro no logout:", error);
      toast({
        title: 'Erro no logout',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
    } catch (error: any) {
      const errorMessage = error.message || 'Não foi possível enviar o e-mail.';
      console.error("Erro ao enviar e-mail de redefinição de senha:", error);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};