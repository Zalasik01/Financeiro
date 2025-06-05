import React from "react";
import { Link } from "react-router-dom"; // Se você usar react-router-dom para navegação

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="text-gray-600">
        As seções de configuração foram movidas para páginas dedicadas.
      </p>
      <p>Utilize o menu principal para navegar para:</p>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            to="/gerenciar-forma-pagamento"
            className="text-blue-600 hover:underline"
          >
            Gerenciar Formas de Pagamento
          </Link>
        </li>
        <li>
          <Link
            to="/gerenciar-usuario"
            className="text-blue-600 hover:underline"
          >
            Gerenciar Usuários
          </Link>
        </li>
        <li>
          <Link
            to="/gerenciar-tipo-movimentacao"
            className="text-blue-600 hover:underline"
          >
            Gerenciar Tipos de Movimentação (Loja)
          </Link>
        </li>
        {/* Adicione links para outras páginas de configuração conforme necessário */}
      </ul>
    </div>
  );
};

export default SettingsPage;
