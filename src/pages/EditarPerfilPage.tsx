import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EditarPerfilPage: React.FC = () => {
  const {
    currentUser,
    updateUserProfileData,
    updateUserPasswordData,
    uploadProfilePhotoAndUpdateURL, // Assumindo que esta função existe e atualiza currentUser no useAuth
    removeProfilePhoto, // Assumindo que esta função existe e atualiza currentUser no useAuth
    loadingAuth,
  } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoRemovalRequested, setIsPhotoRemovalRequested] = useState(false);

  const MAX_FILE_SIZE_MB = 5; // Alterado para 5MB
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setPhotoPreview(currentUser.photoURL || null);
    }
  }, [currentUser]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "image/png") {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo PNG.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "Arquivo muito grande",
          description: `O tamanho máximo do arquivo é ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setIsPhotoRemovalRequested(false); // Se selecionou nova foto, não está mais pedindo para remover
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsPhotoRemovalRequested(true);
    toast({
      title: "Foto de perfil será removida",
      description: "Clique em 'Salvar Perfil' para confirmar a remoção.",
      variant: "success",
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    let profileDataChanged = false;

    try {
      // Etapa 1: Lidar com a atualização da foto de perfil
      if (isPhotoRemovalRequested) {
        if (removeProfilePhoto) {
          // Verifica se a função foi fornecida pelo hook
          await removeProfilePhoto();
        }
        profileDataChanged = true;
      } else if (photoFile) {
        if (uploadProfilePhotoAndUpdateURL) {
          // Verifica se a função foi fornecida pelo hook
          await uploadProfilePhotoAndUpdateURL(photoFile);
        }
        profileDataChanged = true;
      }
      // Etapa 2: Lidar com a atualização do nome de exibição
      if (currentUser.displayName !== displayName) {
        await updateUserProfileData({ displayName }); // Esta função também deve atualizar o currentUser no useAuth.
        profileDataChanged = true;
      }

      if (profileDataChanged) {
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações de perfil foram salvas.",
        });
      } else {
        toast({
          title: "Nenhuma alteração",
          description: "Nenhuma informação do perfil foi modificada.",
        });
      }
      setIsPhotoRemovalRequested(false); // Reseta o estado de remoção
      setPhotoFile(null); // Limpa o arquivo selecionado após o "upload"
    } catch (error: unknown) { // Substituído 'any' por 'unknown'
  console.error("Erro ao atualizar perfil:", error);
  // O toast de erro já é tratado no hook useAuth
} finally {
  setIsUpdatingProfile(false);
}
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Erro",
        description: "As novas senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    if (!currentPassword || !newPassword) {
      toast({
        title: "Erro",
        description: "Senha atual e nova senha são obrigatórias.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPasswordData(currentPassword, newPassword);
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: unknown) { // Substituído 'any' por 'unknown'
  // Toast de erro já é tratado no hook useAuth
  console.error("Erro ao atualizar senha:", error);
} finally {
  setIsUpdatingPassword(false);
}
  };

  if (loadingAuth || !currentUser) {
    return (
      <div className="w-[90%] mx-auto p-4 text-center">
        Carregando perfil...
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto p-4 md:p-8 max-w-2xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          {" "}
          {/* Adicionado space-y-6 para espaçamento uniforme */}
          <CardContent className="space-y-6">
            {" "}
            {/* Adicionado space-y-6 para espaçamento uniforme */}
            {/* Seção de Upload de Foto */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={photoPreview || undefined}
                  alt={displayName}
                />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex space-x-2">
                <div>
                  <Label
                    htmlFor="photoUpload"
                    className="cursor-pointer text-blue-600 hover:underline"
                  >
                    Alterar foto
                  </Label>
                  <span className="text-xs text-gray-500 ml-1">
                    (PNG, máx {MAX_FILE_SIZE_MB}MB)
                  </span>
                  <Input
                    id="photoUpload"
                    type="file"
                    accept="image/png"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={isUpdatingProfile}
                  />
                </div>
                {(photoPreview || photoFile) && (
                  <Button
                    type="button"
                    variant="link"
                    className="text-red-600 hover:underline p-0 h-auto"
                    onClick={handleRemovePhoto}
                    disabled={isUpdatingProfile}
                  >
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
            {/* Nome de Exibição */}
            <div>
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isUpdatingProfile}
              />
            </div>
            {/* Email (Desabilitado) */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />{" "}
              {/* Mantido desabilitado */}
              <p className="text-xs text-gray-500 mt-1">
                O e-mail não pode ser alterado por aqui.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingProfile} className="bg-gray-800 hover:bg-gray-900 text-white">
              {isUpdatingProfile ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordUpdate}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingPassword} className="bg-gray-800 hover:bg-gray-900 text-white">
              {isUpdatingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditarPerfilPage;
