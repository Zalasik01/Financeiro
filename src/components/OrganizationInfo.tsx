import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationInfo } from "@/hooks/useOrganizationInfo";
import { Building, Shield, Users } from "lucide-react";
import React from "react";

interface OrganizationInfoProps {
  className?: string;
}

export const OrganizationInfo: React.FC<OrganizationInfoProps> = ({
  className,
}) => {
  const { baseInfo, sessionInfo } = useOrganizationInfo();

  if (!baseInfo || !sessionInfo) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building className="h-5 w-5 text-primary" />
          Organização Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">
              {baseInfo.numberId ? `${baseInfo.numberId} - ` : ""}
              {baseInfo.name}
            </span>
            <Badge
              variant={baseInfo.ativo ? "default" : "secondary"}
              className={baseInfo.ativo ? "bg-green-100 text-green-800" : ""}
            >
              {baseInfo.ativo ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              Logado como: {sessionInfo.displayName || sessionInfo.email}
            </span>
          </div>
          {sessionInfo.isAdmin && (
            <div className="flex items-center gap-2 text-sm text-primary mt-1">
              <Shield className="h-4 w-4" />
              <span>Administrador</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
