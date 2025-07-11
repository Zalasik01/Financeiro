import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BarChart3, Building, LogOut, ShieldCheck, Users } from "lucide-react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AdminHeader: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: BarChart3,
      exact: true,
    },
    {
      href: "/admin/gestao-bases",
      label: "Gestão de Bases",
      icon: Building,
      exact: false,
    },
    {
      href: "/admin/gerenciar-usuarios-global",
      label: "Gerenciar Usuários",
      icon: Users,
      exact: false,
    },
  ];

  const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP;
  let formattedBuildDate = "N/A";
  if (buildTimestamp) {
    const date = new Date(buildTimestamp);
    if (!isNaN(date.getTime())) {
      formattedBuildDate = date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }

  return (
    <header className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo/Título */}
            <Link
              to="/admin"
              className="flex items-center gap-2 text-xl font-semibold hover:text-slate-300"
            >
              <ShieldCheck size={28} />
              <span className="hidden sm:inline">Painel Administrativo</span>
              <span className="sm:hidden">Admin</span>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.href
                  : location.pathname.startsWith(item.href) &&
                    item.href !== "/admin";

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-700 text-white"
                        : "hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* User info and logout */}
            {currentUser && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {currentUser.displayName || "Administrador"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Compilação: {formattedBuildDate}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium hover:bg-red-700 hover:text-white px-3 py-2"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
