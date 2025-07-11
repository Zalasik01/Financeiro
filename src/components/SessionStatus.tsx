import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { accessToken, clearSession, hasValidSession } from "@/utils/storage";
import { Key, RefreshCw, Trash2 } from "lucide-react";
import React from "react";

interface SessionStatusProps {
  className?: string;
  showControls?: boolean;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  className,
  showControls = false,
}) => {
  const [token, setToken] = React.useState<string | null>(null);
  const [isValid, setIsValid] = React.useState(false);
  const { currentUser, logout } = useAuth();

  React.useEffect(() => {
    const updateSessionInfo = () => {
      const currentToken = accessToken.get();
      setToken(currentToken);
      setIsValid(hasValidSession());
    };

    updateSessionInfo();

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateSessionInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshToken = async () => {
    if (currentUser) {
      try {
        const newToken = await currentUser.getIdToken(true); // Força refresh
        accessToken.set(newToken);
        setToken(newToken);
      } catch (error) {
        console.error("Erro ao renovar token:", error);
      }
    }
  };

  const handleClearSession = () => {
    clearSession();
    setToken(null);
    setIsValid(false);
    logout({
      title: "Sessão Limpa",
      description: "Dados da sessão foram removidos.",
      variant: "default",
    });
  };

  const getTokenPreview = (token: string) => {
    if (token.length > 20) {
      return `${token.substring(0, 10)}...${token.substring(
        token.length - 10
      )}`;
    }
    return token;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5 text-primary" />
          Status da Sessão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "Ativa" : "Inválida"}
          </Badge>
        </div>

        {token && (
          <div>
            <span className="text-sm font-medium">Token:</span>
            <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
              {getTokenPreview(token)}
            </div>
          </div>
        )}

        {showControls && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshToken}
              disabled={!currentUser}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClearSession}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
