import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientesFornecedores } from "@/hooks/useClientesFornecedores"; // Importa o hook
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"; 
import { Badge } from "@/components/ui/badge"; // Para exibir se é cliente ou fornecedor
import { PlusCircle, Edit2, Trash2 } from "lucide-react"; // Ícones
import { useNavigate } from "react-router-dom"; // Para navegação

export const GerenciarClientesFornecedoresPage: React.FC = () => {
  const {
    clientesFornecedores,
    carregando,
    deletarClienteFornecedor
  } = useClientesFornecedores();

  const [busca, setBusca] = useState("");

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientesFornecedores;
    return clientesFornecedores.filter((cf) => {
      return (
        (cf.nome && cf.nome.toLowerCase().includes(termo)) ||
        (cf.numeroDocumento && cf.numeroDocumento.replace(/\D/g, "").includes(termo.replace(/\D/g, "")))
      );
    });
  }, [busca, clientesFornecedores]);
  
  const navigate = useNavigate();

  // Abre o modal para um novo cadastro
  const navegarParaNovoCadastro = () => {
    navigate("/clientes-fornecedores/editar/novo");
  };

  // Navega para a página de edição
  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  // Navega para visualizar/editar cliente
  const navegarParaVisualizarCliente = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  // Lida com a exclusão de um registro
  const lidarComDelecao = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      await deletarClienteFornecedor(id, nome);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full bg-[#F4F4F4] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Clientes e Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <input
              type="text"
              className="w-80 border border-gray-300 hover:border-black focus:border-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por nome ou CNPJ..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <Button onClick={navegarParaNovoCadastro} className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Nome/Razão Social</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tipo</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Documento</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Telefone</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Cliente</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Fornecedor</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center">
                      Carregando cadastros...
                    </td>
                  </tr>
                )}
                {!carregando && clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      Nenhum cliente ou fornecedor encontrado.
                    </td>
                  </tr>
                )}
                {!carregando && clientesFiltrados.length > 0 && clientesFiltrados.map((cf) => (
                  <tr key={cf.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navegarParaVisualizarCliente(cf.id)}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{cf.nome}</td>
                    <td className="border border-gray-300 px-4 py-2">{cf.nomeFantasia ? "PJ" : "PF"}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {cf.tipoDocumento}: {cf.numeroDocumento || "Não informado"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{cf.telefone || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">{cf.email || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {cf.ehCliente ? "Sim" : "Não"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {cf.ehFornecedor ? "Sim" : "Não"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navegarParaEditar(cf.id);
                          }} 
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700" 
                          onClick={(e) => {
                            e.stopPropagation();
                            lidarComDelecao(cf.id, cf.nome);
                          }} 
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Total: <strong>{clientesFiltrados.length}</strong> registro(s)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};