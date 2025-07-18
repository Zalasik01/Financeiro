import { supabase } from "@/supabaseClient";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface InviteData {
  id?: number;
  token: string;
  id_base_cliente: number;
  numerobaseidentificacao?: number;
  status: "pendente" | "usado" | "expirado";
  criado_por: number;
  usado_por?: number;
  expiraem: string;
  usadoem?: string;
  criado_em: string;
  email: string; // Campo adicional para o email do convidado
  nome: string; // Campo adicional para o nome do convidado
}

export const useInvites = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Função para gerar um token único
  const generateInviteToken = () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  // Criar convite
  const createInvite = async (
    email: string,
    nome: string,
    baseClienteId: number,
    numeroBaseIdentificacao?: number
  ): Promise<string | null> => {
    if (!currentUser || !currentUser.isAdmin) {
      toast({
        title: "Erro",
        description: "Apenas administradores podem criar convites.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Buscar o ID do usuário atual na tabela usuario
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("id")
        .eq("email", currentUser.email)
        .single();

      if (userError || !userData) {
        toast({
          title: "Erro",
          description: "Não foi possível identificar o usuário criador.",
          variant: "destructive",
        });
        return null;
      }

      const token = generateInviteToken();
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7); // Expira em 7 dias

      const { error } = await supabase.from("convite").insert({
        token,
        id_base_cliente: baseClienteId,
        numerobaseidentificacao: numeroBaseIdentificacao,
        status: "pendente",
        criado_por: userData.id,
        expiraem: expiraEm.toISOString(),
        // Nota: email e nome não são campos da tabela, mas vamos usar metadata
      });

      if (error) {
        toast({
          title: "Erro ao criar convite",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Criar entrada adicional para metadata do convite (email e nome)
      // Vamos usar a tabela anotacao_base para isso temporariamente
      await supabase.from("anotacao_base").insert({
        id_base_cliente: baseClienteId,
        conteudo: JSON.stringify({
          type: "invite_metadata",
          token,
          email,
          nome,
        }),
        criado_por: userData.id,
      });

      toast({
        title: "Convite criado",
        description: "O convite foi criado com sucesso.",
        variant: "success",
      });

      return token;
    } catch (err) {
      console.error("Erro ao criar convite:", err);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar convite.",
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
        .eq("status", "pendente")
        .single();

      if (error || !data) {
        return null;
      }

      // Verificar se não expirou
      if (new Date(data.expiraem) < new Date()) {
        // Marcar como expirado
        await supabase
          .from("convite")
          .update({ status: "expirado" })
          .eq("token", token);
        return null;
      }

      // Buscar metadata do convite
      const { data: metadataList } = await supabase
        .from("anotacao_base")
        .select("*")
        .eq("id_base_cliente", data.id_base_cliente);

      let email = "";
      let nome = "";

      // Procurar metadata do convite
      if (metadataList) {
        for (const metadata of metadataList) {
          try {
            const parsed = JSON.parse(metadata.conteudo);
            if (parsed.type === "invite_metadata" && parsed.token === token) {
              email = parsed.email;
              nome = parsed.nome;
              break;
            }
          } catch {
            // Ignorar erros de parse
          }
        }
      }

      return {
        ...data,
        email,
        nome,
      };
    } catch (err) {
      console.error("Erro ao validar convite:", err);
      return null;
    }
  };

  // Marcar convite como usado
  const markInviteAsUsed = async (
    token: string,
    userId: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("convite")
        .update({
          status: "usado",
          usado_por: userId,
          usadoem: new Date().toISOString(),
        })
        .eq("token", token);

      return !error;
    } catch (err) {
      console.error("Erro ao marcar convite como usado:", err);
      return false;
    }
  };

  return {
    createInvite,
    validateInvite,
    markInviteAsUsed,
  };
};
