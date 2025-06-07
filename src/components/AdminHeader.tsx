import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ShieldCheck, Users, Settings, Building, UserCog } from "lucide-react";

const AdminHeader: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* O link principal do admin pode ir para o dashboard ou para a primeira página de gestão */}
            <Link 
              to="/admin"
              className="flex items-center gap-2 text-xl font-semibold hover:text-slate-300"
            >
              <ShieldCheck size={28} />
              Painel Administrativo
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {/* Adicione links de navegação do admin aqui, se necessário */}
            <Link 
              to="/admin/store-management" // Rota principal da gestão de bases e admins
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-700"
            >
              <Building size={16} />
              Gestão de Base
            </Link>
            <Link 
              to="/admin/gerenciar-usuarios-global" // Nova rota para gestão global de usuários
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-700"
            >
              <UserCog size={16} />
              Usuários
            </Link>
            {/* <Link
              to="/admin/settings" // Exemplo
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-700"
            >
              <Settings size={16} />
              Configurações Admin
            </Link> */}
            {currentUser && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm font-medium hover:bg-red-700 hover:text-white"
              >
                <LogOut size={16} />
                Sair
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
