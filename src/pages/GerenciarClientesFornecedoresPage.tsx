import React, { useState } from "react";
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
  
  const navigate = useNavigate();

  // Abre o modal para um novo cadastro
  const navegarParaNovoCadastro = () => {
    navigate("/clientes-fornecedores/novo");
  };

  // Navega para a página de edição
  const navegarParaEditar = (idRegistro: string) => {
    navigate(`/clientes-fornecedores/editar/${idRegistro}`);
  };

  // Lida com a exclusão de um registro
  const lidarComDelecao = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`)) {
      await deletarClienteFornecedor(id, nome);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clientes e Fornecedores</CardTitle>
          <Button onClick={navegarParaNovoCadastro}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Cadastro
          </Button>
        </CardHeader>

        <CardContent>
          {carregando && <p className="text-center">Carregando cadastros...</p>}
          {!carregando && clientesFornecedores.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum cliente ou fornecedor cadastrado ainda.</p>
          )}
          {!carregando && clientesFornecedores.length > 0 && (
            <div className="space-y-3">
              {clientesFornecedores.map((cf) => (
                <div key={cf.id} className="border p-4 rounded-lg flex justify-between items-center hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-semibold text-lg">{cf.nome}</p>
                    <p className="text-sm text-gray-600">
                      {cf.tipoDocumento}: {cf.numeroDocumento || "Não informado"}
                    </p>
                    <div className="mt-1 space-x-1">
                      {cf.ehCliente && <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Cliente</Badge>}
                      {cf.ehFornecedor && <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Fornecedor</Badge>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navegarParaEditar(cf.id)} title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => lidarComDelecao(cf.id, cf.nome)} title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};