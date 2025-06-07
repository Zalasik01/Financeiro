import React, { useState, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { functions } from "@/firebase"; // Importar 'functions'
import { httpsCallable } from "firebase/functions"; // Importar httpsCallable
import { Users, UserPlus, ShieldOff } from "lucide-react";

interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

interface AdminManagementProps {
  adminUsers: AppUser[];
  onSetUserToRevoke: (user: AppUser | null) => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({
  adminUsers,
  onSetUserToRevoke,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  // A função signup do useAuth não será mais usada aqui para criar admins

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminDisplayName, setNewAdminDisplayName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminDisplayName.trim() || !newAdminPassword.trim()) {
      toast({ title: "Erro", description: "Todos os campos são obrigatórios para criar um administrador.", variant: "destructive" });
      return;
    }
    if (newAdminPassword.length < 6) {
      toast({ title: "Erro", description: "A senha temporária deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setIsCreatingAdmin(true);

    try {
      const createAdminUserFunction = httpsCallable(functions, 'createAdminUser');
      const result = await createAdminUserFunction({
        email: newAdminEmail,
        password: newAdminPassword,
        displayName: newAdminDisplayName,
      });

      const resultData = result.data as { success: boolean; message: string; uid?: string };

      if (resultData.success) {
        toast({ title: "Sucesso!", description: resultData.message, variant: "success" });
        setNewAdminEmail("");
        setNewAdminDisplayName("");
        setNewAdminPassword("");
      } else {
        toast({ title: "Erro ao criar administrador", description: resultData.message || "Ocorreu um erro.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao chamar Cloud Function createAdminUser:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível criar o administrador.", variant: "destructive" });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6" /> Gerenciar Administradores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreateAdmin} className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Criar Novo Administrador</h3>
          <div>
            <Label htmlFor="newAdminEmail">Email do Novo Administrador *</Label>
            <Input id="newAdminEmail" type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="email@exemplo.com" required />
          </div>
          <div>
            <Label htmlFor="newAdminDisplayName">Nome de Exibição *</Label>
            <Input id="newAdminDisplayName" value={newAdminDisplayName} onChange={(e) => setNewAdminDisplayName(e.target.value)} placeholder="Nome Completo" required />
          </div>
          <div>
            <Label htmlFor="newAdminPassword">Senha Temporária *</Label>
            <Input id="newAdminPassword" type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
          </div>
          <Button type="submit" disabled={isCreatingAdmin} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            {isCreatingAdmin ? "Criando..." : "Criar Administrador"}
          </Button>
        </form>

        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">Administradores Atuais</h3>
          {adminUsers.length === 0 ? (<p>Nenhum administrador cadastrado.</p>) : (
            <ul className="space-y-2">
              {adminUsers.map((admin) => (
                <li key={admin.uid} className="p-3 border rounded-md flex justify-between items-center bg-white dark:bg-slate-800">
                  <div>
                    <p className="font-medium text-primary">{admin.displayName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{admin.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">UID: {admin.uid}</p>
                  </div>
                  {currentUser?.uid !== admin.uid && (
                    <Button variant="outline" size="sm" onClick={() => onSetUserToRevoke(admin)}>
                      <ShieldOff className="mr-2 h-4 w-4" /> Revogar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};