import React, { useEffect, useState } from "react"; // Adicionado useState
import { Link, useLocation, useNavigate } from "react-router-dom"; // Adicionado useNavigate
import { cn } from "@/lib/utils"; // Para classes condicionais (opcional, mas útil)
import { Button } from "@/components/ui/button"; // Importar Button
import { HelpModal } from "./HelpModal"; // Importar o HelpModal
import { Menu, X } from "lucide-react"; // Ícones para o menu hambúrguer

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
  const navigate = useNavigate(); // Inicializa o hook useNavigate
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verifica se CTRL + Space foram pressionados
      if (event.ctrlKey && event.code === "Space") {
        // Impede o comportamento padrão do navegador para CTRL + Space (se houver)
        event.preventDefault();
        // Redireciona para /transacao usando o navigate do React Router
        navigate("/transacao");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Função de limpeza para remover o event listener quando o componente for desmontado
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      {/* Ajuste para ocupar a largura total com padding */}
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl hover:text-gray-300">
              Financeiro App
            </Link>
          </div>
          <div className="hidden lg:block">
            {" "}
            {/* Alterado de md:block para lg:block para dar mais espaço */}
            <div className="ml-10 flex items-baseline space-x-4">
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
              <Button
                variant="ghost"
                onClick={() => setIsHelpModalOpen(true)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                🆘 Ajuda
              </Button>
            </div>
          </div>
          {/* Botão do Menu Hambúrguer */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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

      {/* Menu Mobile */}
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
            <Button
              variant="ghost"
              onClick={() => {
                setIsHelpModalOpen(true);
                closeMobileMenu();
              }}
              className="w-full justify-start px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              🆘 Ajuda
            </Button>
          </div>
        </div>
      )}

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => {
          setIsHelpModalOpen(false);
        }}
      />
    </nav>
  );
};

export default Navbar;
