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

  const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP;
  let formattedBuildDate = "N/A";
  if (buildTimestamp) {
    const date = new Date(buildTimestamp);
    if (!isNaN(date.getTime())) {
      formattedBuildDate = date.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    }
  }

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
              <div className="flex flex-col items-end"> {/* Container para alinhar o botão e o texto */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium hover:bg-red-700 hover:text-white"
                >
                  <LogOut size={16} />
                  Sair
                </Button>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compilação: {formattedBuildDate}
                </p>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
