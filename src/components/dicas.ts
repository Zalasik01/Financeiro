export interface Dica {
  titulo?: string;
  conteudo: string;
}

export const DICAS: Record<string, Dica> = {
  // Dicas Gerais
  visaoGeral: {
    titulo: "Visão Geral",
    conteudo: "Acompanhe um resumo das suas finanças, incluindo receitas, despesas e saldo atual."
  },
  // Dicas para Transações
  transacaoDescricao: {
    titulo: "Descrição da Transação",
    conteudo: "Descreva brevemente a transação. Ex: 'Almoço no restaurante', 'Salário do mês'."
  },
  transacaoValor: {
    titulo: "Valor da Transação",
    conteudo: "Informe o valor monetário da transação."
  },
  transacaoTipo: {
    titulo: "Tipo de Transação",
    conteudo: "Selecione se é uma 'Receita' (entrada de dinheiro) ou 'Despesa' (saída de dinheiro)."
  },
  transacaoCategoria: {
    titulo: "Categoria da Transação",
    conteudo: "Classifique a transação em uma categoria para melhor organização e análise dos seus gastos e receitas."
  },
  transacaoData: {
    titulo: "Data da Transação",
    conteudo: "Selecione a data em que a transação ocorreu."
  },
  transacaoLoja: {
    titulo: "Loja Associada",
    conteudo: "Se esta transação pertence a uma loja específica, selecione-a aqui. Útil para DRE e controle por unidade."
  },
  // Dicas para Categorias
  gerenciarCategorias: {
    titulo: "Gerenciar Categorias",
    conteudo: "Crie e organize categorias para classificar suas receitas e despesas, facilitando a análise financeira."
  },
  categoriaNome: {
    titulo: "Nome da Categoria",
    conteudo: "Dê um nome claro para a categoria. Ex: 'Alimentação', 'Transporte', 'Salário'."
  },
  categoriaTipo: {
    titulo: "Tipo da Categoria",
    conteudo: "Indique se esta categoria agrupa 'Receitas' ou 'Despesas'."
  },
  // Dicas para Lojas
  gerenciarLojas: {
    titulo: "Gerenciar Lojas",
    conteudo: "Cadastre e edite suas lojas ou unidades de negócio. O CNPJ é usado apenas para identificação e não é validado."
  },
  lojaNome: {
    titulo: "Nome da Loja",
    conteudo: "Nome oficial ou fantasia da sua loja/unidade de negócio."
  },
  lojaCNPJ: {
    titulo: "CNPJ da Loja",
    conteudo: "Cadastro Nacional da Pessoa Jurídica da loja (apenas para identificação)."
  },
  lojaApelido: {
    titulo: "Apelido da Loja",
    conteudo: "Um nome curto ou apelido para identificar a loja facilmente em relatórios."
  },
  lojaCodigo: {
    titulo: "Código da Loja",
    conteudo: "Um código interno, se aplicável, para identificar a loja."
  },
  lojaIcone: {
    titulo: "Ícone da Loja",
    conteudo: "Escolha um emoji ou faça upload de uma imagem PNG para representar a loja visualmente."
  },
  lojaPadrao: {
    titulo: "Loja Padrão",
    conteudo: "Marque se esta loja deve ser pré-selecionada em formulários como o de transações."
  },
  // Dicas para Fechamentos
  fazerFechamento: {
    titulo: "Fazer Fechamento",
    conteudo: "Registre os fechamentos de caixa de suas lojas. As transações financeiras (receitas e despesas) da data e loja selecionadas serão automaticamente incluídas."
  },
  fechamentoLoja: {
    titulo: "Loja do Fechamento",
    conteudo: "Selecione a loja para a qual este fechamento de caixa se refere."
  },
  fechamentoData: {
    titulo: "Data do Fechamento",
    conteudo: "Indique a data em que o caixa da loja foi fechado."
  },
  fechamentoSaldoInicial: {
    titulo: "Saldo Inicial",
    conteudo: "Valor em caixa no início do período de fechamento."
  },
  fechamentoSaldoFinal: {
    titulo: "Saldo Final",
    conteudo: "Valor em caixa ao final do período, após todas as movimentações. Este valor é sugerido (Saldo Inicial + Entradas - Saídas), mas pode ser ajustado."
  },
  // Dicas para DRE
  relatorioDRE: {
    titulo: "Relatório DRE",
    conteudo: "Gere o Demonstrativo do Resultado do Exercício para analisar a performance financeira das suas lojas em um período específico."
  },
  drePeriodo: {
    titulo: "Período do DRE",
    conteudo: "Selecione o mês e ano para gerar o Demonstrativo do Resultado do Exercício."
  },
  dreLoja: {
    titulo: "Loja para DRE",
    conteudo: "Escolha uma loja específica para ver seu DRE individual, ou deixe em branco para um DRE consolidado de todas as lojas."
  },
  // Dicas para Metas
  metasLojas: {
    titulo: "Metas das Lojas",
    conteudo: "Defina e acompanhe as metas de faturamento para cada uma de suas lojas, mês a mês."
  },
  // Dicas para Formas de Pagamento
  formasPagamento: {
    titulo: "Formas de Pagamento",
    conteudo: "Cadastre as formas de pagamento aceitas em seus fechamentos de loja (Ex: Dinheiro, Cartão Loja X, PIX)."
  },
  // Dicas para Tipos de Movimentação (Loja)
  tiposMovimentacaoLoja: {
    titulo: "Tipos de Movimentação (Loja)",
    conteudo: "Crie tipos para movimentações manuais específicas do caixa da loja, como 'Sangria', 'Reforço de Caixa', 'Venda Manual'."
  },
  transacaoClienteFornecedor: {
  titulo: "Selecione um cliente ou fornecedor.",
    conteudo: "Se você selecionar um cliente ou fornecedor, ele será associado a esta transação. Isso é útil para rastrear transações específicas relacionadas a pessoas ou empresas."
  }
};