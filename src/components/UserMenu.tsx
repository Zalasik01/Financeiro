import React from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User as UserIcon, LogOut, Edit3 } from "lucide-react";

export const UserMenu = () => {
  const { currentUser, logout, updateUserProfileData } = useAuth();

  // Se o estado de loading do useAuth for true, ou se não houver currentUser,
  // você pode optar por não renderizar nada ou um placeholder.
  // A lógica de !loading já está no AuthProvider, então currentUser deve estar
  // definido (ou null) quando UserMenu for renderizado.
  if (!currentUser) {
    // Idealmente, se não há usuário, este componente não deveria ser renderizado
    // ou deveria haver um redirecionamento para a página de login.
    // Retornar null aqui é uma opção se a lógica de roteamento cuida disso.
    return null;
  }

  const handleEditProfile = () => {
    // Exemplo simples de edição de nome usando prompt.
    // Para uma melhor UX, use um modal/dialog com um formulário.
    const newName = prompt(
      "Digite seu novo nome:",
      currentUser.displayName || ""
    );
    if (
      newName &&
      newName.trim() !== "" &&
      newName !== currentUser.displayName
    ) {
      updateUserProfileData({ displayName: newName })
        .then(() => {
          // O toast de sucesso já é mostrado pela função updateUserProfileData
          console.log("Perfil atualizado com sucesso na UI!");
        })
        .catch((error) => {
          // O toast de erro já é mostrado pela função updateUserProfileData
          console.error("Falha ao atualizar perfil na UI:", error);
        });
    } else if (newName === "") {
      alert("O nome não pode ser vazio.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-auto px-3 flex items-center space-x-2"
        >
          {/* Você pode adicionar um Avatar aqui se tiver photoURL */}
          {/* Exemplo: <Avatar><AvatarImage src={currentUser.photoURL} /><AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback></Avatar> */}
          <UserIcon className="h-5 w-5" />
          <span>{currentUser.displayName || "Usuário"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {currentUser.displayName || "Usuário"}
            </p>
            {currentUser.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEditProfile}>
          <Edit3 className="mr-2 h-4 w-4" />
          <span>Editar Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
