import { useState, useEffect, useCallback } from "react";
import { db } from "@/firebase"; // Importa a configuração do Firebase
import {
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  serverTimestamp,
  query,
  orderByChild,
} from "firebase/database"; // Funções do Realtime Database
import { useAuth } from "./useAuth"; // Hook para autenticação e dados do usuário
import { useToast } from "./use-toast"; // Hook para exibir notificações (toasts)
import { ClienteFornecedor } from "@/types/clienteFornecedor.tsx"; // Tipo de dados definido anteriormente

// Hook customizado para gerenciar operações de CRUD para Clientes/Fornecedores
export const useClientesFornecedores = () => {
  const { currentUser, selectedBaseId } = useAuth(); // Obtém usuário logado e ID da base selecionada
  const { toast } = useToast(); // Para exibir mensagens ao usuário
  const [clientesFornecedores, setClientesFornecedores] = useState<ClienteFornecedor[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true); // Estado de carregamento

  // Caminho base no Firebase para os dados de clientes/fornecedores da base selecionada
  const caminhoBase = `clientBases/${selectedBaseId}/appClientesFornecedores`;

  // Efeito para carregar a lista de clientes/fornecedores quando o usuário ou a base selecionada mudar
  useEffect(() => {
    if (!currentUser || !selectedBaseId) {
      setClientesFornecedores([]);
      setCarregando(false);
      return; // Sai se não houver usuário ou base selecionada
    }

    setCarregando(true);
    // Cria uma consulta para buscar os dados ordenados pelo nome
    const consultaClientesFornecedores = query(ref(db, caminhoBase), orderByChild("nome"));

    // Listener em tempo real para atualizações na lista
    const unsubscribe = onValue(
      consultaClientesFornecedores,
      (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
          const lista: ClienteFornecedor[] = Object.keys(dados).map((chave) => ({
            id: chave,
            ...dados[chave],
            // dataCadastro e dataAtualizacao já são timestamps
          }));
          setClientesFornecedores(lista);
        } else {
          setClientesFornecedores([]);
        }
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao carregar clientes/fornecedores:", erro);
        toast({
          title: "Erro ao Carregar Dados",
          description: "Não foi possível carregar a lista de clientes/fornecedores.",
          variant: "destructive",
        });
        setCarregando(false);
      }
    );

    // Limpa o listener quando o componente é desmontado ou as dependências mudam
    return () => unsubscribe();
  }, [currentUser, selectedBaseId, caminhoBase, toast]);

  // Função para adicionar um novo cliente/fornecedor
  const adicionarClienteFornecedor = useCallback(
    async (dados: Omit<ClienteFornecedor, "id" | "dataCadastro" | "dataAtualizacao">) => {
      if (!currentUser || !selectedBaseId) {
        toast({ title: "Erro de Autenticação", description: "Usuário não autenticado ou base de dados não selecionada.", variant: "destructive" });
        return null;
      }
      try {
        const novaRef = push(ref(db, caminhoBase)); // Gera um ID único
        const novoRegistro: Omit<ClienteFornecedor, "id"> = {
          ...dados,
          dataCadastro: serverTimestamp() as unknown as number, // Firebase preencherá com o timestamp do servidor
          dataAtualizacao: serverTimestamp() as unknown as number,
        };
        await set(novaRef, novoRegistro);
        toast({ title: "Cadastro Realizado", description: `${dados.ehFornecedor ? 'Fornecedor' : 'Cliente'} "${dados.nome}" foi adicionado com sucesso.`, variant: "success" });
        return novaRef.key; // Retorna o ID do novo registro
      } catch (erro) {
        console.error("Erro ao adicionar cliente/fornecedor:", erro);
        toast({ title: "Falha no Cadastro", description: "Não foi possível adicionar o cliente/fornecedor. Tente novamente.", variant: "destructive" });
        return null;
      }
    },
    [currentUser, selectedBaseId, caminhoBase, toast]
  );

  // Função para atualizar um cliente/fornecedor existente
  const atualizarClienteFornecedor = useCallback(
    async (id: string, dados: Partial<Omit<ClienteFornecedor, "id" | "dataCadastro">>) => {
      if (!currentUser || !selectedBaseId) {
        toast({ title: "Erro de Autenticação", description: "Usuário não autenticado ou base de dados não selecionada.", variant: "destructive" });
        return false;
      }
      try {
        const registroRef = ref(db, `${caminhoBase}/${id}`);
        const atualizacoes = {
          ...dados,
          dataAtualizacao: serverTimestamp(), // Atualiza o timestamp da última modificação
        };
        await update(registroRef, atualizacoes);
        toast({ title: "Atualização Realizada", description: `Os dados de "${dados.nome || 'Cliente/Fornecedor'}" foram atualizados.`, variant: "success" });
        return true;
      } catch (erro) {
        console.error("Erro ao atualizar cliente/fornecedor:", erro);
        toast({ title: "Falha na Atualização", description: "Não foi possível atualizar os dados. Tente novamente.", variant: "destructive" });
        return false;
      }
    },
    [currentUser, selectedBaseId, caminhoBase, toast]
  );

  // Função para deletar um cliente/fornecedor
  const deletarClienteFornecedor = useCallback(
    async (id: string, nome: string) => {
      if (!currentUser || !selectedBaseId) {
        toast({ title: "Erro de Autenticação", description: "Usuário não autenticado ou base de dados não selecionada.", variant: "destructive" });
        return false;
      }
      try {
        const registroRef = ref(db, `${caminhoBase}/${id}`);
        await remove(registroRef);
        toast({ title: "Remoção Concluída", description: `"${nome}" foi removido com sucesso.`, variant: "success" });
        return true;
      } catch (erro) { // Corrigido: Adicionado parêntese de abertura
        console.error("Erro ao deletar cliente/fornecedor:", erro);
        toast({ title: "Falha na Remoção", description: "Não foi possível remover o cliente/fornecedor. Tente novamente.", variant: "destructive" });
        return false;
      } // Corrigido: Adicionado parêntese de fechamento
    },
    [currentUser, selectedBaseId, caminhoBase, toast]
  );

  // Retorna os dados e funções para serem usados pelos componentes
  return {
    clientesFornecedores,
    carregando,
    adicionarClienteFornecedor,
    atualizarClienteFornecedor,
    deletarClienteFornecedor,
  };
};