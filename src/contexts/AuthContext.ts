import type { ClientBase } from "@/types/store";
import { createContext } from "react";

interface AppUser {
  id: string;
  email: string;
  nome_exibicao?: string;
  admin?: boolean;
  id_base_padrao?: number | null;
  status?: string;
}

export interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signup: (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string | null,
    inviteClientBaseUUID?: string | null
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  getUserClientBases: () => Promise<ClientBase[]>;
  userCanAccess: (clientBaseId: number | null) => Promise<boolean>;
  getUserAccessLevel: (clientBaseId: number | null) => Promise<string | null>;
  clearError: () => void;
  clientBases: ClientBase[];
  refreshUserData: () => Promise<void>;
  selectedClientBase: ClientBase | null;
  setSelectedClientBase: (base: ClientBase | null) => void;
  hasPermission: (permission: string) => boolean;
  userPermissions: string[];
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
