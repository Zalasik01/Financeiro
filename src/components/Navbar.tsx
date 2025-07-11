import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"; // Para mobile
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Para desktop
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores"; // Adicionar useStores
import { cn } from "@/lib/utils";
import {
  Archive,
  BarChart3,
  Briefcase,
  ChevronDown,
  Contact,
  CreditCard,
  Database,
  Home,
  ListChecks,
  Menu,
  Settings,
  Tag,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HelpModal } from "./HelpModal";
import { InstallPWAButton } from "./InstallPWAButton";
import { UserMenu } from "./UserMenu";

interface NavSubItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

interface NavItemConfig {
  href?: string;
  label: string;
  icon?: React.ElementType;
  submenu?: NavSubItem[];
}

const navItems: NavItemConfig[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/transacao", label: "Transações", icon: ListChecks },
  {
    label: "Cadastros",
    icon: Database,
    submenu: [
      { href: "/categoria", label: "Categorias", icon: Tag },
      { href: "/loja", label: "Lojas", icon: Briefcase },
      {
        href: "/clientes-fornecedores",
        label: "Clientes/Fornecedores",
        icon: Contact,
      },
      {
        href: "/forma-pagamento",
        label: "Formas de Pagamento",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Relatórios",
    icon: TrendingUp,
    submenu: [
      { href: "/dre", label: "DRE", icon: BarChart3 },
      { href: "/fechamento", label: "Fechamentos", icon: Archive },
    ],
  },
  {
    label: "Gestão",
    icon: Settings,
    submenu: [{ href: "/meta", label: "Metas", icon: Target }],
  },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, selectedBaseId } = useAuth(); // Obter selectedBaseId
  const { bases } = useStores(); // Obter a lista de bases
  const navigate = useNavigate();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(
    null
  );

  // Encontrar os detalhes da base selecionada
  const selectedBaseDetails = selectedBaseId
    ? bases.find((b) => b.id === selectedBaseId)
    : null;

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
  const toggleMobileSubmenu = (label: string) => {
    if (openMobileSubmenu === label) {
      setOpenMobileSubmenu(null);
    } else {
      setOpenMobileSubmenu(label);
    }
  };

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

          {/* Menu Desktop (visível em telas médias e grandes) */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            {/* Links de Navegação */}
            {navItems.map((item) =>
              item.submenu ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                    >
                      {item.icon && (
                        <item.icon className="mr-1 lg:mr-2 h-4 w-4" />
                      )}
                      <span className="hidden lg:inline">{item.label}</span>
                      <span className="lg:hidden">
                        {item.label.slice(0, 4)}
                      </span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="bg-gray-800 border-gray-700 text-white"
                  >
                    {item.submenu.map((subItem) => (
                      <DropdownMenuItem key={subItem.href} asChild>
                        <Link
                          to={subItem.href}
                          className={cn(
                            "px-3 py-2 text-sm hover:bg-gray-700 w-full flex items-center",
                            location.pathname === subItem.href
                              ? "bg-gray-900"
                              : ""
                          )}
                        >
                          {subItem.icon && (
                            <subItem.icon className="mr-2 h-4 w-4" />
                          )}
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.href}
                  to={item.href!}
                  className={cn(
                    "px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center",
                    location.pathname === item.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  {item.icon && <item.icon className="mr-1 lg:mr-2 h-4 w-4" />}
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.label.slice(0, 4)}</span>
                </Link>
              )
            )}
            {/* Ações e Menu do Usuário */}
            <div className="flex items-center space-x-1 lg:space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsHelpModalOpen(true)}
                className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                title="Ajuda"
              >
                <span className="hidden lg:inline">Ajuda</span>
                <span className="lg:hidden">?</span>
              </Button>
              {currentUser?.isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/admin")}
                  className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                  title="Gestão Sistema"
                >
                  <Settings className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Gestão Sistema</span>
                </Button>
              )}
              <InstallPWAButton />
              {selectedBaseDetails && (
                <div className="hidden xl:flex items-center px-2 lg:px-3 py-2 rounded-md text-sm font-medium text-gray-300">
                  <Database size={16} className="mr-1 lg:mr-2 text-gray-400" />
                  <span className="truncate max-w-32">
                    {selectedBaseDetails.name} (#{selectedBaseDetails.numberId})
                  </span>
                </div>
              )}
              <UserMenu />
            </div>
          </div>

          {/* Botão do Menu Hambúrguer (visível em telas pequenas e médias) */}
          <div className="md:hidden flex items-center">
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
        <div className="md:hidden border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) =>
              item.submenu ? (
                <Collapsible
                  key={item.label}
                  open={openMobileSubmenu === item.label}
                  onOpenChange={() => toggleMobileSubmenu(item.label)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                    >
                      <div className="flex items-center">
                        {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                        {item.label}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          openMobileSubmenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-1 mt-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 flex items-center",
                          location.pathname === subItem.href
                            ? "bg-gray-900 text-white"
                            : "text-gray-300 hover:text-white"
                        )}
                      >
                        {subItem.icon && (
                          <subItem.icon className="mr-2 h-5 w-5" />
                        )}
                        {subItem.label}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  key={item.href}
                  to={item.href!}
                  onClick={closeMobileMenu}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 flex items-center",
                    location.pathname === item.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                  {item.label}
                </Link>
              )
            )}
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
            {currentUser?.isAdmin && (
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/admin");
                  closeMobileMenu();
                }}
                className="w-full justify-start px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
              >
                <Settings className="mr-2 h-5 w-5" />
                Gestão Sistema
              </Button>
            )}
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
