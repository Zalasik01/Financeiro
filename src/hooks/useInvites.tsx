import { supabase } from "@/supabaseClient";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface InviteData {
  id?: number;
  token: string;
  email: string;
  nome?: string;
  admin?: boolean | string;
  id_usuario?: number;
  status: "PENDENTE" | "ATIVO" | "INATIVO";
  criado_em?: string;
  usado_em?: string;
  expira_em?: string;
}

export interface CreateInviteParams {
  email: string;
  nome: string;
  admin: boolean;
  id_usuario?: number; // id inteiro do usuário já criado
}

export const useInvites = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Gerar token único
  const generateToken = () => {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  // Criar convite
  const createInvite = async (
    params: CreateInviteParams
  ): Promise<string | null> => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      // Primeiro, criar ou atualizar o usuário na tabela
      let userId = params.id_usuario;

      if (!userId) {
        // Criar usuário pendente
        const { data: newUser, error: userError } = await supabase
          .from("usuario")
          .insert({
            email: params.email,
            nome: params.nome,
            admin: params.admin,
            status: "PENDENTE",
          })
          .select("id")
          .single();

        if (userError) {
          throw userError;
        }

        userId = newUser.id;
      }

      // Criar convite
      const { error: inviteError } = await supabase.from("convite").insert({
        token,
        email: params.email,
        nome: params.nome,
        admin: params.admin,
        id_usuario: userId,
        status: "PENDENTE",
        expira_em: expiresAt.toISOString(),
      });

      if (inviteError) {
        throw inviteError;
      }

      const inviteLink = `${window.location.origin}/invite?token=${token}`;

      toast({
        title: "Convite Criado",
        description: "O convite foi criado com sucesso.",
        variant: "success",
      });

      return inviteLink;
    } catch (error) {
      console.error("Erro ao criar convite:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar convite.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Validar convite
  const validateInvite = async (token: string): Promise<InviteData | null> => {
    try {
      const { data, error } = await supabase
        .from("convite")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        return null;
      }

      // Se já foi usado, retornar dados mas com status ATIVO
      if (data.status === "ATIVO") {
        return data;
      }

      // Se não está pendente e não está ativo, é inválido
      if (data.status !== "PENDENTE") {
        return null;
      }

      // Verificar se não expirou (apenas para convites pendentes)
      if (data.expira_em && new Date(data.expira_em) < new Date()) {
        // Marcar como expirado
        await supabase
          .from("convite")
          .update({ status: "INATIVO" })
          .eq("token", token);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao validar convite:", error);
      return null;
    }
  };

  // Marcar convite como usado
  const markInviteAsUsed = async (token: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("convite")
        .update({
          status: "ATIVO",
          usado_em: new Date().toISOString(),
        })
        .eq("token", token);

      return !error;
    } catch (error) {
      console.error("Erro ao marcar convite como usado:", error);
      return false;
    }
  };

  return {
    createInvite,
    validateInvite,
    markInviteAsUsed,
  };
};
