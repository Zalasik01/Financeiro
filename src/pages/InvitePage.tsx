import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const InvitePage: React.FC = () => {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateInvite = async () => {
      if (!inviteToken) {
        setError("Token de convite inválido ou ausente.");
        setIsLoading(false);
        return;
      }

      try {
        const inviteRef = ref(db, `invites/${inviteToken}`);
        const snapshot = await get(inviteRef);

        if (snapshot.exists()) {
          const inviteData = snapshot.val();
          if (inviteData.status === "pending") {
            // Armazena o clientBaseId e o token para usar na página de cadastro
            sessionStorage.setItem("inviteToken", inviteToken);
            sessionStorage.setItem(
              "inviteClientBaseUUID",
              inviteData.clientBaseId
            ); // UUID da base
            sessionStorage.setItem(
              "inviteClientBaseNumberId",
              inviteData.clientBaseNumberId
            ); // numberId da base

            // Salvar dados do usuário para preencher automaticamente
            if (inviteData.displayName) {
              sessionStorage.setItem(
                "inviteDisplayName",
                inviteData.displayName
              );
            }
            if (inviteData.email) {
              sessionStorage.setItem("inviteEmail", inviteData.email);
            }

            navigate("/signup", {
              replace: true,
              // Opcional: passar via state também, mas sessionStorage é mais robusto
              // state: { fromInvite: true, clientBaseUUID: inviteData.clientBaseId, clientBaseNumberId: inviteData.clientBaseNumberId },
            });
          } else {
            setError(
              `Este convite já foi ${
                inviteData.status === "used"
                  ? "utilizado"
                  : "expirado ou é inválido"
              }.`
            );
          }
        } else {
          setError("Convite não encontrado ou inválido.");
        }
      } catch (err) {
        console.error("Erro ao validar convite:", err);
        setError(
          "Ocorreu um erro ao processar seu convite. Tente novamente mais tarde."
        );
      } finally {
        setIsLoading(false);
      }
    };

    validateInvite();
  }, [inviteToken, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">
          Validando seu convite...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Erro no Convite
        </h1>
        <p className="text-lg text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <p className="text-lg text-muted-foreground">Redirecionando...</p>
    </div>
  );
};

export default InvitePage;
