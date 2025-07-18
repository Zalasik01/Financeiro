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
import { useInvites } from "@/hooks/useInvites";
import { supabase } from "@/supabaseClient";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { validateInvite, markInviteAsUsed } = useInvites();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);

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
        const invite = await validateInvite(token);
        if (invite) {
          setInviteData(invite);
          setFormData((prev) => ({
            ...prev,
            nome: invite.nome || "",
          }));
        } else {
          setError("Convite inválido ou expirado");
        }
      } catch (error) {
        console.error("Erro ao validar convite:", error);
        setError("Erro ao validar convite");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

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
      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.senha,
        options: {
          data: {
            needs_password_setup: false,
            display_name: formData.nome,
          },
        },
      });

      let uid = authData?.user?.id;
      console.log(
        "[InvitePage] signUp result - uid:",
        uid,
        "error:",
        authError?.message
      );

      // 2. Se o usuário já existe, tentar login direto
      if (
        authError &&
        authError.message &&
        authError.message.includes("User already registered")
      ) {
        console.log("[InvitePage] Usuário já existe, fazendo login...");
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: inviteData.email,
            password: formData.senha,
          });
        if (signInError) {
          // Se a senha estiver errada, mostrar mensagem amigável
          if (
            signInError.message &&
            signInError.message
              .toLowerCase()
              .includes("invalid login credentials")
          ) {
            setError(
              "Usuário já possui cadastro. Caso tenha esquecido a senha, recupere pelo link de login."
            );
            setIsLoading(false);
            return;
          }
          throw signInError;
        }
        uid = signInData?.user?.id;
        console.log("[InvitePage] signIn result - uid:", uid);
      } else if (authError) {
        throw authError;
      }

      // 3. Buscar UID do usuário autenticado, se não veio do signUp/signIn
      if (!uid) {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          // Se ainda não conseguiu o UID, gerar um novo UUID como fallback
          uid = crypto.randomUUID();
          console.log("[InvitePage] Gerou novo UUID:", uid);
        } else {
          uid = userData.user.id;
          console.log("[InvitePage] getUser result - uid:", uid);
        }
      }

      // 4. Sempre atualizar uuid, nome e status para ATIVO (não tentar inserir)
      const { error: updateError } = await supabase
        .from("usuario")
        .update({
          uuid: uid,
          nome: formData.nome,
          status: "ATIVO",
        })
        .eq("email", inviteData.email);
      if (updateError) {
        throw updateError;
      }
      // Log para conferência
      console.log("[InvitePage] uuid salvo no banco:", uid);

      // 5. Marcar convite como usado
      await markInviteAsUsed(token!);

      // 6. Usuario já está autenticado, redirecionar para o dashboard
      console.log("[InvitePage] Conta ativada com sucesso! Redirecionando...");
      navigate("/");
    } catch (error: unknown) {
      console.error("Erro ao ativar conta:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao ativar conta";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
