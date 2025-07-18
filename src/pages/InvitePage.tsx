import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    id?: number;
    token: string;
    email: string;
    nome?: string;
    admin?: boolean;
    id_usuario?: number;
    status: string;
    criado_em?: string;
    usado_em?: string;
    expira_em?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    senha: "",
    confirmarSenha: "",
    nome: "",
  });

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de convite não encontrado");
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        // Fazer a validação diretamente aqui para evitar dependência do hook
        const { data, error } = await supabase
          .from("convite")
          .select("*")
          .eq("token", token)
          .single();

        if (error || !data) {
          setError("Convite inválido ou expirado");
          return;
        }

        // Verificar se o convite já foi usado
        if (data.status === "ATIVO") {
          setError("Este convite já foi utilizado");
          return;
        }

        // Se não está pendente, é inválido
        if (data.status !== "PENDENTE") {
          setError("Convite inválido ou expirado");
          return;
        }

        // Verificar se não expirou
        if (data.expira_em && new Date(data.expira_em) < new Date()) {
          setError("Convite expirado");
          return;
        }

        setInviteData(data);
        setFormData((prev) => ({
          ...prev,
          nome: data.nome || "",
        }));
      } catch (error) {
        console.error("Erro ao validar convite:", error);
        setError("Erro ao validar convite");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]); // Removida a dependência validateInvite

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!formData.nome.trim()) {
      setError("Nome de exibição é obrigatório");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[InvitePage] handleSubmit START", {
        inviteData,
        token,
        formData,
        url: window.location.href,
      });

      if (!inviteData) {
        console.error("[InvitePage] Dados do convite não encontrados", {
          token,
          formData,
        });
        throw new Error("Dados do convite não encontrados");
      }

      if (!token) {
        console.error("[InvitePage] Token do convite não encontrado", {
          inviteData,
          formData,
        });
        throw new Error("Token do convite não encontrado");
      }

      const redirectUrl = `${
        window.location.origin
      }/reset-password?from=invite&token=${token}&email=${encodeURIComponent(
        inviteData.email
      )}&name=${encodeURIComponent(formData.nome)}`;
      console.log("[InvitePage] Enviando resetPasswordForEmail", {
        email: inviteData.email,
        redirectUrl,
      });

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        inviteData.email,
        { redirectTo: redirectUrl }
      );

      if (resetError) {
        console.error("[InvitePage] Erro ao enviar reset:", resetError, {
          email: inviteData.email,
          redirectUrl,
        });

        // Se o reset falhar, pode ser que o usuário não exista ainda
        // Tentar criar o usuário primeiro
        console.log("[InvitePage] Reset falhou, tentando criar usuário...", {
          email: inviteData.email,
          formData,
        });

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: inviteData.email,
            password: formData.senha,
            options: {
              data: {
                display_name: formData.nome,
                from_invite: true,
              },
            },
          });

        if (signUpError) {
          console.error("[InvitePage] signUpError", signUpError);
          if (signUpError.message.includes("User already registered")) {
            // Usuário existe mas não conseguiu fazer reset
            // Tentar login direto
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: inviteData.email,
                password: formData.senha,
              });

            if (signInError) {
              console.error("[InvitePage] signInError", signInError);
              throw new Error(
                "Usuário existe mas a senha não confere. Use 'Esqueci minha senha' na tela de login."
              );
            }

            // Login deu certo, continuar com ativação
            await ativarConta(
              signInData.user.id,
              formData.nome,
              inviteData.email,
              token
            );
            console.log("[InvitePage] Conta ativada com sucesso via login!");
            navigate("/");
            return;
          } else {
            throw signUpError;
          }
        }

        // SignUp deu certo
        await ativarConta(
          signUpData.user?.id || "",
          formData.nome,
          inviteData.email,
          token
        );
        console.log("[InvitePage] Conta criada e ativada com sucesso!");
        navigate("/");
        return;
      }

      // Reset de senha enviado com sucesso
      console.log("[InvitePage] Reset de senha enviado com sucesso", {
        email: inviteData.email,
        redirectUrl,
      });
      setError(
        "Foi enviado um link de configuração de senha para seu email. Clique no link para completar a ativação da sua conta."
      );
      setIsLoading(false);
    } catch (error: unknown) {
      console.error("[InvitePage] Erro ao ativar conta:", error, {
        inviteData,
        token,
        formData,
        url: window.location.href,
      });
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao ativar conta";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para ativar conta
  const ativarConta = async (
    authUserId: string,
    nome: string,
    email: string,
    token: string
  ) => {
    // Atualizar o usuário na tabela usuario
    const { error: updateError } = await supabase
      .from("usuario")
      .update({
        uuid: authUserId,
        nome: nome,
        status: "ATIVO",
      })
      .eq("email", email)
      .eq("status", "PENDENTE");

    if (updateError) {
      console.error("[InvitePage] Erro ao atualizar usuário:", updateError);
      throw updateError;
    }

    // Marcar convite como usado
    const { error: inviteUpdateError } = await supabase
      .from("convite")
      .update({
        status: "ATIVO",
        usado_em: new Date().toISOString(),
      })
      .eq("token", token);

    if (inviteUpdateError) {
      console.warn(
        "[InvitePage] Falha ao marcar convite como usado:",
        inviteUpdateError
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            Validando convite...
          </p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Erro no Convite</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                className="w-full mt-4"
                onClick={() => navigate("/login")}
              >
                Voltar ao Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Ativar Conta</CardTitle>
            <CardDescription>
              Complete seu cadastro para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData?.email || ""}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="nome">Nome de Exibição *</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Como você gostaria de ser chamado?"
                />
              </div>

              <div>
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={formData.senha}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                <Input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  required
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  placeholder="Digite a senha novamente"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  "Ativar Conta"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvitePage;
