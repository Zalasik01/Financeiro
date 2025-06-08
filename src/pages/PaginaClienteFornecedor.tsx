import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClienteFornecedorForm } from "@/components/ClienteFornecedorForm";
import { useClientesFornecedores } from "@/hooks/useClientesFornecedores";
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PaginaClienteFornecedor: React.FC = () => {
  const navigate = useNavigate();
  const { id: clienteFornecedorId } = useParams<{ id?: string }>(); // Para futura edição nesta página
  const { 
    adicionarClienteFornecedor, 
    atualizarClienteFornecedor, 
    clientesFornecedores 
  } = useClientesFornecedores();

  const estaEditando = !!clienteFornecedorId;
  const dadosIniciais = estaEditando 
    ? clientesFornecedores.find(cf => cf.id === clienteFornecedorId) 
    : null;

  const aoSubmeterFormulario = async (dados: Omit<ClienteFornecedor, "id" | "dataCadastro" | "dataAtualizacao">) => {
    if (estaEditando && clienteFornecedorId) {
      await atualizarClienteFornecedor(clienteFornecedorId, dados);
    } else {
      await adicionarClienteFornecedor(dados);
    }
    navigate("/clientes-fornecedores"); // Volta para a lista após salvar
  };

  return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate("/clientes-fornecedores")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>
            {estaEditando ? "Editar" : "Novo Cadastro de"} Cliente/Fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteFornecedorForm
            // A key força a remontagem se estivermos alternando entre novo e edição na mesma rota (não é o caso aqui, mas boa prática)
            key={clienteFornecedorId || 'novo'} 
            dadosIniciais={dadosIniciais}
            aoSubmeter={aoSubmeterFormulario}
            aoCancelar={() => navigate("/clientes-fornecedores")}
            estaEditando={estaEditando}
            // tipoPessoaParaNovo não é mais necessário aqui, pois o form terá o seletor
          />
        </CardContent>
      </Card>
    </div>
  );
};