import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const InvitePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  // Extrai access_token, type e erros do hash/query string
  function getInviteParams() {
    // 1. Tenta pegar da query string
    const searchParams = new URLSearchParams(location.search);
    let accessToken = searchParams.get("access_token");
    let type = searchParams.get("type");
    let inviteError = searchParams.get("error");
    let inviteErrorCode = searchParams.get("error_code");
    let inviteErrorDescription = searchParams.get("error_description");
    // 2. Se não encontrar, tenta pegar do hash (fragment)
    if (location.hash && location.hash.startsWith("#")) {
      const hashString = location.hash.substring(1);
      const hashParams = new URLSearchParams(hashString);
      accessToken = accessToken || hashParams.get("access_token");
      type = type || hashParams.get("type");
      inviteError = inviteError || hashParams.get("error");
      inviteErrorCode = inviteErrorCode || hashParams.get("error_code");
      inviteErrorDescription =
        inviteErrorDescription || hashParams.get("error_description");
    }
    return {
      accessToken,
      type,
      inviteError,
      inviteErrorCode,
      inviteErrorDescription,
    };
  }

  const {
    accessToken,
    type,
    inviteError,
    inviteErrorCode,
    inviteErrorDescription,
  } = getInviteParams();
  // Só permite acesso se for type=recovery (convite ou redefinição)
  const isInvite = type === "recovery" && !!accessToken;

  // Se vier erro de link expirado do Supabase, mostra tela amigável
  if (inviteError === "access_denied" && inviteErrorCode === "otp_expired") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Link expirado ou inválido
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          O link de convite expirou ou já foi utilizado. Solicite um novo
          convite ao administrador.
          <br />
          <span className="text-xs text-muted-foreground">
            {inviteErrorDescription &&
              decodeURIComponent(inviteErrorDescription)}
          </span>
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Atualiza a senha do usuário autenticado com o token do convite
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      setSuccess(true);
      toast({
        title: "Senha definida com sucesso!",
        description: "Você já pode acessar o sistema.",
        variant: "success",
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao definir senha. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInvite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Link inválido ou expirado
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          O link de convite é inválido, expirou ou já foi utilizado.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Senha definida com sucesso!
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Você será redirecionado para o login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card p-6 rounded shadow"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">
          Defina sua senha
        </h1>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Nova senha</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">Confirme a senha</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && (
          <div className="mb-4 text-destructive text-center text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          Definir senha
        </button>
      </form>
    </div>
  );
};

export default InvitePage;
