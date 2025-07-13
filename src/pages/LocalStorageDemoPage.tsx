import { OrganizationInfo } from "@/components/OrganizationInfo";
import     <div className="w-[90%] mx-auto p-4 space-y-8"> SessionStatus } from "@/components/SessionStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationInfo } from "@/hooks/useOrganizationInfo";
import {
  accessToken,
  clearAll,
  clearSession,
  hasValidSession,
  selectedBase,
  userEmail,
  userSession,
  type StoredBaseInfo,
  type StoredUserSession,
} from "@/utils/storage";
import { Database, Eye, EyeOff, Trash2 } from "lucide-react";
import React from "react";

interface StorageData {
  accessToken: string | null;
  userEmail: string | null;
  userSession: StoredUserSession | null;
  selectedBase: StoredBaseInfo | null;
  hasValidSession: boolean;
}

export default function LocalStorageDemoPage() {
  const [showRawData, setShowRawData] = React.useState(false);
  const [storageData, setStorageData] = React.useState<StorageData>({
    accessToken: null,
    userEmail: null,
    userSession: null,
    selectedBase: null,
    hasValidSession: false,
  });
  const {
    baseInfo,
    sessionInfo,
    hasValidSession: hasSession,
  } = useOrganizationInfo();

  const updateStorageData = () => {
    const data = {
      accessToken: accessToken.get(),
      userEmail: userEmail.get(),
      userSession: userSession.get(),
      selectedBase: selectedBase.get(),
      hasValidSession: hasValidSession(),
    };
    setStorageData(data);
  };

  React.useEffect(() => {
    updateStorageData();

    // Atualizar a cada 2 segundos
    const interval = setInterval(updateStorageData, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClearSession = () => {
    clearSession();
    updateStorageData();
  };

  const handleClearAll = () => {
    clearAll();
    updateStorageData();
  };

  return (
    <div className="w-[90%] mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LocalStorage Demo</h1>
          <p className="text-muted-foreground mt-2">
            Demonstração do sistema de armazenamento local da aplicação
          </p>
        </div>
        <Badge variant={hasSession ? "default" : "secondary"}>
          {hasSession ? "Sessão Ativa" : "Sem Sessão"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Organização */}
        <OrganizationInfo />

        {/* Status da Sessão */}
        <SessionStatus showControls={true} />
      </div>

      {/* Controles de Limpeza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Controles de Limpeza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleClearSession}
              className="flex-1"
            >
              Limpar Sessão
              <span className="text-xs text-muted-foreground ml-2">
                (mantém email)
              </span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="flex-1"
            >
              Limpar Tudo
              <span className="text-xs text-muted-foreground ml-2">
                (remove tudo)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados Brutos do localStorage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Dados do LocalStorage
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showRawData ? "Ocultar" : "Mostrar"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showRawData ? (
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(storageData, null, 2)}
            </pre>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email do Usuário:</span>
                  <p className="text-muted-foreground">
                    {storageData.userEmail || "Não definido"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Token de Acesso:</span>
                  <p className="text-muted-foreground">
                    {storageData.accessToken ? "Presente" : "Ausente"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Sessão do Usuário:</span>
                  <p className="text-muted-foreground">
                    {storageData.userSession ? "Ativa" : "Inativa"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Base Selecionada:</span>
                  <p className="text-muted-foreground">
                    {storageData.selectedBase?.name || "Nenhuma"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
