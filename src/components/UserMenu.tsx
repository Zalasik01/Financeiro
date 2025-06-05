import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Importar Link e useNavigate
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Importar Avatar
import { Button } from "@/components/ui/button";
import { LogOut, Edit3 } from "lucide-react"; // Manter Edit3 e LogOut

export const UserMenu = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate(); // Adicionar useNavigate

  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full" // Ajustado para Avatar
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={currentUser.photoURL || undefined}
              alt={currentUser.displayName || "User"}
            />
            <AvatarFallback>
              {getInitials(currentUser.displayName)}
            </AvatarFallback>
          </Avatar>
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
        <DropdownMenuItem asChild>
          <Link
            to="/editar-perfil"
            className="flex items-center cursor-pointer w-full"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            <span>Editar Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer flex items-center"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
