import React, { useEffect } from "react"; // Adicionado useEffect
import { Link, useLocation, useNavigate } from "react-router-dom"; // Adicionado useNavigate
import { cn } from "@/lib/utils"; // Para classes condicionais (opcional, mas útil)

const navItems = [
  { href: "/", label: "📊 Visão Geral" },
  { href: "/transacao", label: "💳 Transações" },
  { href: "/categoria", label: "🏷️ Categorias" },
  { href: "/loja", label: "🏪 Lojas" },
  { href: "/fechamento", label: "📊 Fechamentos" },
  { href: "/dre", label: "📋 DRE" },
  { href: "/meta", label: "🎯 Metas" },
  { href: "/forma-pagamento", label: "💳 Formas de Pagamento" },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Inicializa o hook useNavigate

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
  }, [navigate]); // Adiciona navigate como dependência do useEffect
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl hover:text-gray-300">
              Financeiro App
            </Link>
          </div>
          <div className="hidden md:block">
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
            </div>
          </div>
          {/* Adicionar aqui um botão para menu mobile se desejar */}
        </div>
      </div>
      {/* Menu Mobile (opcional, pode ser implementado depois) */}
      {/* <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700",
                location.pathname === item.href ? "bg-gray-900 text-white" : "text-gray-300 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div> */}
    </nav>
  );
};

export default Navbar;
