import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HelpModal } from "./HelpModal";
import { Menu, X, Database } from "lucide-react";
import { InstallPWAButton } from "./InstallPWAButton";
import { UserMenu } from "./UserMenu";
import { useStores } from "@/hooks/useStores"; // Adicionar useStores
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Visão Geral" },
  { href: "/transacao", label: "Transações" },
  { href: "/categoria", label: "Categorias" },
  { href: "/loja", label: "Lojas" },
  { href: "/fechamento", label: "Fechamentos" },
  { href: "/dre", label: "DRE" },
  { href: "/meta", label: "Metas" },
  { href: "/forma-pagamento", label: "Formas de Pagamento" },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, selectedBaseId } = useAuth(); // Obter selectedBaseId
  const { bases } = useStores(); // Obter a lista de bases
  const navigate = useNavigate();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Encontrar os detalhes da base selecionada
  const selectedBaseDetails = selectedBaseId ? bases.find(b => b.id === selectedBaseId) : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === "Space") {
        event.preventDefault();
        navigate("/transacao");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Lado Esquerdo: Logo */}
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl hover:text-gray-300">
              Financeiro App
            </Link>
          </div>

          {/* Menu Desktop (visível em telas grandes) */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {/* Links de Navegação */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700",
                  location.pathname === item.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Ações e Menu do Usuário */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsHelpModalOpen(true)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Ajuda
              </Button>
              <InstallPWAButton />
              {selectedBaseDetails && (
                <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300">
                  <Database size={16} className="mr-2 text-gray-400" />
                  <span>
                    {selectedBaseDetails.name} (#{selectedBaseDetails.numberId})
                  </span>
                </div>
              )}
              <UserMenu />
            </div>
          </div>

          {/* Botão do Menu Hambúrguer (visível em telas pequenas) */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Abrir menu principal</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Mobile (Conteúdo que abre) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700",
                  location.pathname === item.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-700 px-2 pt-2 pb-3 space-y-2">
            {/* Informação da Base de Dados para consistência com o desktop */}
            {selectedBaseDetails && (
              <div className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-300">
                <Database size={18} className="mr-2 text-gray-400" />
                <span>
                  {selectedBaseDetails.name} (#{selectedBaseDetails.numberId})
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setIsHelpModalOpen(true);
                closeMobileMenu();
              }}
              className="w-full justify-start px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Ajuda
            </Button>
            <InstallPWAButton />
            <div className="border-t border-gray-700 pt-3 mt-2">
              <UserMenu />
            </div>
          </div>
        </div>
      )}

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
