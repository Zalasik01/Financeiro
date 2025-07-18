import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const type = searchParams.get("type");
  const fromInvite = searchParams.get("from") === "invite";
  const inviteToken = searchParams.get("token");
  const email = searchParams.get("email");
  const nameParam = searchParams.get("name");

  useEffect(() => {
    if (nameParam) {
      setNome(decodeURIComponent(nameParam));
    }

    // Se temos tokens, configurar a sessão
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, [accessToken, refreshToken, nameParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    if (fromInvite && !nome.trim()) {
      setError("Nome de exibição é obrigatório.");
      return;
    }

    setIsLoading(true);

    try {
      if (fromInvite && accessToken) {
        // Fluxo de convite - usuário clicou no link do email
        console.log("[ResetPassword] Processando convite...");

        const { error: updateError } = await supabase.auth.updateUser({
          password: senha,
          data: {
            display_name: nome,
            from_invite: true,
          },
        });

        if (updateError) {
          throw updateError;
        }

        // Obter dados do usuário autenticado
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData?.user?.id) {
          throw new Error("Não foi possível obter dados do usuário");
        }

        // Atualizar tabela usuario
        const { error: updateUserError } = await supabase
          .from("usuario")
          .update({
            uuid: userData.user.id,
            nome: nome,
            status: "ATIVO",
          })
          .eq("email", userData.user.email)
          .eq("status", "PENDENTE");

        if (updateUserError) {
          console.error("Erro ao ativar usuário:", updateUserError);
        }

        // Marcar convite como usado
        if (inviteToken) {
          const { error: inviteError } = await supabase
            .from("convite")
            .update({
              status: "ATIVO",
              usado_em: new Date().toISOString(),
            })
            .eq("token", inviteToken);

          if (inviteError) {
            console.error("Erro ao marcar convite:", inviteError);
          }
        }

        setSuccess(true);
        setTimeout(() => navigate("/"), 2000);
      } else if (type === "recovery" && accessToken) {
        // Fluxo de recuperação de senha normal
        console.log("[ResetPassword] Processando recuperação de senha...");

        const { error: updateError } = await supabase.auth.updateUser({
          password: senha,
        });

        if (updateError) {
          throw updateError;
        }

        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Link de recuperação inválido ou expirado.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao redefinir senha.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              {fromInvite ? "Definir Senha da Conta" : "Redefinir Senha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success ? (
              <Alert className="mb-4">
                <AlertDescription>
                  {fromInvite
                    ? "Senha definida e conta ativada com sucesso! Redirecionando..."
                    : "Senha redefinida com sucesso! Redirecionando..."}
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {fromInvite && (
                  <>
                    {email && (
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="nome">Nome de Exibição *</Label>
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Como você gostaria de ser chamado?"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="senha">Nova senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? "Salvando..."
                    : fromInvite
                    ? "Ativar Conta"
                    : "Redefinir Senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
