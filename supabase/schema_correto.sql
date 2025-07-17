-- 🗄️ Schema SQL Completo para Supabase
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ================================
-- TABELAS PRINCIPAIS (ordem correta)
-- ================================

-- 1. Tabela de bases de clientes (DEVE VIR PRIMEIRO)
CREATE SEQUENCE seq_basecliente START WITH 1;
CREATE TABLE basecliente (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_basecliente'),
  nome TEXT NOT NULL,
  cnpj TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  limiteacesso INTEGER,
  motivoinativa TEXT,
  idcriador INTEGER, -- Será referência para usuario(id) - adicionada depois
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de usuários
CREATE SEQUENCE seq_usuario START WITH 1;
CREATE TABLE usuario (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_usuario'),
  -- uidfirebase removido: agora usamos apenas o id sequencial do Supabase
  email TEXT UNIQUE NOT NULL,
  nomeexibicao TEXT,
  admin BOOLEAN DEFAULT FALSE,
  idbasepadrao INTEGER REFERENCES basecliente(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Agora adicionar a referência de volta para usuario
ALTER TABLE basecliente ADD CONSTRAINT fk_basecliente_criador 
  FOREIGN KEY (idcriador) REFERENCES usuario(id);

-- 3. Responsáveis das bases
CREATE SEQUENCE seq_responsavelbase START WITH 1;
CREATE TABLE responsavelbase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_responsavelbase'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  cargo TEXT,
  financeiro BOOLEAN DEFAULT FALSE,
  sistema BOOLEAN DEFAULT FALSE,
  contato BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Acesso de usuários às bases
CREATE SEQUENCE seq_acessousuariobase START WITH 1;
CREATE TABLE acessousuariobase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_acessousuariobase'),
  idusuario INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nomeexibicao TEXT,
  email TEXT,
  status TEXT DEFAULT 'ativo',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_base UNIQUE(idusuario, idbasecliente)
);

-- 5. Lojas/Unidades
CREATE SEQUENCE seq_loja START WITH 1;
CREATE TABLE loja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_loja'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT,
  apelido TEXT,
  codigo TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Endereços das lojas
CREATE SEQUENCE seq_enderecoloja START WITH 1;
CREATE TABLE enderecoloja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_enderecoloja'),
  idloja INTEGER REFERENCES loja(id) ON DELETE CASCADE,
  tipologradouro TEXT,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Telefones das lojas
CREATE SEQUENCE seq_telefoneloja START WITH 1;
CREATE TABLE telefoneloja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_telefoneloja'),
  idloja INTEGER REFERENCES loja(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  principal BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. E-mails das lojas
CREATE SEQUENCE seq_emailloja START WITH 1;
CREATE TABLE emailloja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_emailloja'),
  idloja INTEGER REFERENCES loja(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  email TEXT NOT NULL,
  principal BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Categorias
CREATE SEQUENCE seq_categoria START WITH 1;
CREATE TABLE categoria (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_categoria'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  ativa BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Métodos de pagamento
CREATE SEQUENCE seq_metodopagamento START WITH 1;
CREATE TABLE metodopagamento (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_metodopagamento'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tipos de movimento
CREATE SEQUENCE seq_tipomovimento START WITH 1;
CREATE TABLE tipomovimento (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_tipomovimento'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Receita', 'Despesa', 'outros')),
  cor TEXT,
  icone TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Clientes/Fornecedores
CREATE SEQUENCE seq_clientefornecedor START WITH 1;
CREATE TABLE clientefornecedor (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_clientefornecedor'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipodocumento TEXT NOT NULL CHECK (tipodocumento IN ('CPF', 'CNPJ', 'Outro')),
  numerodocumento TEXT,
  nomefantasia TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Endereços de clientes/fornecedores
CREATE SEQUENCE seq_endereco_clientefornecedor START WITH 1;
CREATE TABLE endereco_clientefornecedor (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_endereco_clientefornecedor'),
  idclientefornecedor INTEGER REFERENCES clientefornecedor(id) ON DELETE CASCADE,
  tipologradouro TEXT,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Telefones de clientes/fornecedores
CREATE SEQUENCE seq_telefone_clientefornecedor START WITH 1;
CREATE TABLE telefone_clientefornecedor (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_telefone_clientefornecedor'),
  idclientefornecedor INTEGER REFERENCES clientefornecedor(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  principal BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 15. E-mails de clientes/fornecedores
CREATE SEQUENCE seq_email_clientefornecedor START WITH 1;
CREATE TABLE email_clientefornecedor (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_email_clientefornecedor'),
  idclientefornecedor INTEGER REFERENCES clientefornecedor(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  email TEXT NOT NULL,
  principal BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Movimentações (transações)
CREATE SEQUENCE seq_movimentacao START WITH 1;
CREATE TABLE movimentacao (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_movimentacao'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  idloja INTEGER REFERENCES loja(id),
  idcategoria INTEGER REFERENCES categoria(id),
  idmetodopagamento INTEGER REFERENCES metodopagamento(id),
  idclientefornecedor INTEGER REFERENCES clientefornecedor(id),
  descricao TEXT,
  valor NUMERIC(15,2) NOT NULL,
  desconto NUMERIC(15,2) DEFAULT 0,
  tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  datamovimentacao DATE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Fechamentos de loja
CREATE SEQUENCE seq_fechamentoloja START WITH 1;
CREATE TABLE fechamentoloja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_fechamentoloja'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  idloja INTEGER REFERENCES loja(id) ON DELETE CASCADE,
  datafechamento DATE NOT NULL,
  saldoinicial NUMERIC(15,2) NOT NULL,
  saldofinal NUMERIC(15,2) NOT NULL,
  totalentradas NUMERIC(15,2) DEFAULT 0,
  totalsaidas NUMERIC(15,2) DEFAULT 0,
  resultadoliquido NUMERIC(15,2) DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Itens de movimentação do fechamento
CREATE SEQUENCE seq_itemmovimentacaofechamento START WITH 1;
CREATE TABLE itemmovimentacaofechamento (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_itemmovimentacaofechamento'),
  idfechamentoloja INTEGER REFERENCES fechamentoloja(id) ON DELETE CASCADE,
  idmovimentacao INTEGER REFERENCES movimentacao(id),
  valor NUMERIC(15,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Metas das lojas
CREATE SEQUENCE seq_metaloja START WITH 1;
CREATE TABLE metaloja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_metaloja'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  idloja INTEGER REFERENCES loja(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  metareceita DECIMAL(15,2) NOT NULL,
  metrica TEXT DEFAULT 'receita',
  criadopor INTEGER REFERENCES usuario(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_loja_mes_ano UNIQUE(idloja, mes, ano)
);

-- 20. Convites de usuário
CREATE SEQUENCE seq_convite START WITH 1;
CREATE TABLE convite (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_convite'),
  token TEXT UNIQUE NOT NULL,
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  numerobaseidentificacao INTEGER,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'usado', 'expirado')),
  criadopor INTEGER REFERENCES usuario(id),
  usadopor INTEGER REFERENCES usuario(id),
  expiraem TIMESTAMPTZ,
  usadoem TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Dados contratuais das bases
CREATE SEQUENCE seq_contratobase START WITH 1;
CREATE TABLE contratobase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_contratobase'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  valormensal DECIMAL(15,2),
  datainicio DATE,
  datafim DATE,
  prazomeses INTEGER,
  observacoes TEXT,
  modopagamento TEXT,
  diavencimentomensal INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Modelos de contrato
CREATE SEQUENCE seq_modelocontrato START WITH 1;
CREATE TABLE modelocontrato (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_modelocontrato'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Anotações das bases
CREATE SEQUENCE seq_anotacaobase START WITH 1;
CREATE TABLE anotacaobase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_anotacaobase'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  datanotacao DATE DEFAULT CURRENT_DATE,
  datacustomizada DATE,
  criadopor INTEGER REFERENCES usuario(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Tabela de lista de permissões
CREATE SEQUENCE seq_listapermissao START WITH 1;
CREATE TABLE listapermissao (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_listapermissao'),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Permissões por base
CREATE SEQUENCE seq_permissaobase START WITH 1;
CREATE TABLE permissaobase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_permissaobase'),
  idbasecliente INTEGER REFERENCES basecliente(id) ON DELETE CASCADE,
  idusuario INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  idpermissao INTEGER REFERENCES listapermissao(id),
  nomepermissao TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- ÍNDICES PARA PERFORMANCE
-- ================================

-- Índices para usuários
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_idbasepadrao ON usuario(idbasepadrao);

-- Índices para bases
CREATE INDEX idx_basecliente_ativa ON basecliente(ativa);
CREATE INDEX idx_basecliente_idcriador ON basecliente(idcriador);

-- Índices para acesso às bases
CREATE INDEX idx_acessousuariobase_idusuario ON acessousuariobase(idusuario);
CREATE INDEX idx_acessousuariobase_idbasecliente ON acessousuariobase(idbasecliente);

-- Índices para lojas
CREATE INDEX idx_loja_idbasecliente ON loja(idbasecliente);
CREATE INDEX idx_loja_ativa ON loja(ativa);

-- Índices para categorias
CREATE INDEX idx_categoria_idbasecliente ON categoria(idbasecliente);
CREATE INDEX idx_categoria_tipo ON categoria(tipo);

-- Índices para movimentações
CREATE INDEX idx_movimentacao_idbasecliente ON movimentacao(idbasecliente);
CREATE INDEX idx_movimentacao_datamovimentacao ON movimentacao(datamovimentacao);
CREATE INDEX idx_movimentacao_idloja ON movimentacao(idloja);
CREATE INDEX idx_movimentacao_idcategoria ON movimentacao(idcategoria);
CREATE INDEX idx_movimentacao_tipo ON movimentacao(tipo);

-- Índices para fechamentos
CREATE INDEX idx_fechamentoloja_idbasecliente ON fechamentoloja(idbasecliente);
CREATE INDEX idx_fechamentoloja_idloja ON fechamentoloja(idloja);
CREATE INDEX idx_fechamentoloja_datafechamento ON fechamentoloja(datafechamento);

-- Índices para metas
CREATE INDEX idx_metaloja_idloja ON metaloja(idloja);
CREATE INDEX idx_metaloja_ano_mes ON metaloja(ano, mes);

-- ================================

CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================

CREATE TRIGGER trg_basecliente_updated_at 
  BEFORE UPDATE ON basecliente 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_usuario_updated_at 
  BEFORE UPDATE ON usuario 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_loja_updated_at 
  BEFORE UPDATE ON loja 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_tipomovimento_updated_at 
  BEFORE UPDATE ON tipomovimento 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_clientefornecedor_updated_at 
  BEFORE UPDATE ON clientefornecedor 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_movimentacao_updated_at 
  BEFORE UPDATE ON movimentacao 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_metaloja_updated_at 
  BEFORE UPDATE ON metaloja 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_contratobase_updated_at 
  BEFORE UPDATE ON contratobase 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_modelocontrato_updated_at 
  BEFORE UPDATE ON modelocontrato 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

CREATE TRIGGER trg_anotacaobase_updated_at 
  BEFORE UPDATE ON anotacaobase 
  FOR EACH ROW EXECUTE PROCEDURE atualizar_updated_at();

-- ================================
-- VIEWS ÚTEIS
-- ================================

-- View para resumo de usuários com bases
CREATE VIEW vw_resumo_usuario_base AS
SELECT 
  u.id,
  u.uidfirebase,
  u.email,
  u.nomeexibicao,
  u.admin,
  cb.id as id_base_padrao,
  cb.nome as nome_base_padrao,
  u.criado_em
FROM usuario u
LEFT JOIN basecliente cb ON u.idbasepadrao = cb.id;

-- View para detalhes de movimentações
CREATE VIEW vw_detalhes_movimentacao AS
SELECT 
  m.id,
  m.descricao,
  m.valor,
  m.desconto,
  m.datamovimentacao,
  m.tipo,
  c.nome as nome_categoria,
  c.tipo as tipo_categoria,
  l.nome as nome_loja,
  cf.nome as nome_cliente_fornecedor,
  mp.nome as nome_metodo_pagamento,
  cb.nome as nome_base_cliente,
  m.criado_em
FROM movimentacao m
LEFT JOIN categoria c ON m.idcategoria = c.id
LEFT JOIN loja l ON m.idloja = l.id
LEFT JOIN clientefornecedor cf ON m.idclientefornecedor = cf.id
LEFT JOIN metodopagamento mp ON m.idmetodopagamento = mp.id
JOIN basecliente cb ON m.idbasecliente = cb.id;

-- View para ranking de lojas
CREATE VIEW vw_ranking_lojas AS
SELECT 
  l.id,
  l.nome,
  l.idbasecliente,
  COUNT(fl.id) as total_fechamentos,
  COALESCE(SUM(fl.totalentradas), 0) as total_receitas,
  COALESCE(SUM(fl.totalsaidas), 0) as total_despesas,
  COALESCE(AVG(fl.resultadoliquido), 0) as saldo_medio,
  MAX(fl.datafechamento) as ultimo_fechamento
FROM loja l
LEFT JOIN fechamentoloja fl ON l.id = fl.idloja
GROUP BY l.id, l.nome, l.idbasecliente;

-- ================================
-- COMENTÁRIOS DAS TABELAS
-- ================================

COMMENT ON TABLE basecliente IS 'Bases de clientes - empresas que usam o sistema';
COMMENT ON TABLE usuario IS 'Usuários do sistema';
COMMENT ON TABLE responsavelbase IS 'Responsáveis das bases de clientes';
COMMENT ON TABLE acessousuariobase IS 'Controle de acesso de usuários às bases';
COMMENT ON TABLE loja IS 'Lojas/Unidades das bases de clientes';
COMMENT ON TABLE categoria IS 'Categorias para classificação de movimentações';
COMMENT ON TABLE metodopagamento IS 'Métodos de pagamento disponíveis';
COMMENT ON TABLE movimentacao IS 'Transações financeiras (receitas e despesas)';
COMMENT ON TABLE fechamentoloja IS 'Fechamentos mensais/diários das lojas';
COMMENT ON TABLE listapermissao IS 'Lista de permissões disponíveis no sistema';
COMMENT ON TABLE permissaobase IS 'Permissões atribuídas por base e usuário';

-- ================================
-- INSERÇÃO DE DADOS INICIAIS
-- ================================

-- Permissões padrão do sistema
INSERT INTO listapermissao (nome, descricao) VALUES 
('ADMIN', 'Administrador do sistema com acesso total'),
('VISUALIZAR_MOVIMENTACOES', 'Visualizar todas as movimentações'),
('CRIAR_MOVIMENTACOES', 'Criar novas movimentações'),
('EDITAR_MOVIMENTACOES', 'Editar movimentações existentes'),
('EXCLUIR_MOVIMENTACOES', 'Excluir movimentações'),
('GERENCIAR_USUARIOS', 'Gerenciar usuários da base'),
('GERENCIAR_LOJAS', 'Gerenciar lojas/unidades'),
('VISUALIZAR_RELATORIOS', 'Visualizar relatórios financeiros'),
('GERENCIAR_CATEGORIAS', 'Gerenciar categorias'),
('GERENCIAR_FECHAMENTOS', 'Realizar fechamentos de caixa');

-- Atualizar nomes de colunas para o padrão com underscore
ALTER TABLE basecliente RENAME COLUMN criadoem TO criado_em;
ALTER TABLE basecliente RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE usuario RENAME COLUMN criadoem TO criado_em;
ALTER TABLE usuario RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE responsavelbase RENAME COLUMN criadoem TO criado_em;

ALTER TABLE acessousuariobase RENAME COLUMN criadoem TO criado_em;

ALTER TABLE loja RENAME COLUMN criadoem TO criado_em;
ALTER TABLE loja RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE enderecoloja RENAME COLUMN criadoem TO criado_em;

ALTER TABLE telefoneloja RENAME COLUMN criadoem TO criado_em;

ALTER TABLE emailloja RENAME COLUMN criadoem TO criado_em;

ALTER TABLE categoria RENAME COLUMN criadoem TO criado_em;

ALTER TABLE metodopagamento RENAME COLUMN criadoem TO criado_em;

ALTER TABLE tipomovimento RENAME COLUMN criadoem TO criado_em;
ALTER TABLE tipomovimento RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE clientefornecedor RENAME COLUMN criadoem TO criado_em;
ALTER TABLE clientefornecedor RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE endereco_clientefornecedor RENAME COLUMN criadoem TO criado_em;

ALTER TABLE telefone_clientefornecedor RENAME COLUMN criadoem TO criado_em;

ALTER TABLE email_clientefornecedor RENAME COLUMN criadoem TO criado_em;

ALTER TABLE movimentacao RENAME COLUMN criadoem TO criado_em;
ALTER TABLE movimentacao RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE fechamentoloja RENAME COLUMN criadoem TO criado_em;

ALTER TABLE itemmovimentacaofechamento RENAME COLUMN criadoem TO criado_em;

ALTER TABLE metaloja RENAME COLUMN criadoem TO criado_em;
ALTER TABLE metaloja RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE convite RENAME COLUMN criadoem TO criado_em;

ALTER TABLE contratobase RENAME COLUMN criadoem TO criado_em;
ALTER TABLE contratobase RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE modelocontrato RENAME COLUMN criadoem TO criado_em;
ALTER TABLE modelocontrato RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE anotacaobase RENAME COLUMN criadoem TO criado_em;
ALTER TABLE anotacaobase RENAME COLUMN atualizadoem TO atualizado_em;

ALTER TABLE listapermissao RENAME COLUMN criadoem TO criado_em;

ALTER TABLE permissaobase RENAME COLUMN criadoem TO criado_em;

-- Atualizar nomes de colunas para o padrão com underscore
ALTER TABLE basecliente RENAME COLUMN idcriador TO id_criador;

ALTER TABLE usuario RENAME COLUMN idbasepadrao TO id_base_padrao;

ALTER TABLE responsavelbase RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE acessousuariobase RENAME COLUMN idusuario TO id_usuario;
ALTER TABLE acessousuariobase RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE loja RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE enderecoloja RENAME COLUMN idloja TO id_loja;

ALTER TABLE telefoneloja RENAME COLUMN idloja TO id_loja;

ALTER TABLE emailloja RENAME COLUMN idloja TO id_loja;

ALTER TABLE categoria RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE metodopagamento RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE tipomovimento RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE clientefornecedor RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE endereco_clientefornecedor RENAME COLUMN idclientefornecedor TO id_cliente_fornecedor;

ALTER TABLE telefone_clientefornecedor RENAME COLUMN idclientefornecedor TO id_cliente_fornecedor;

ALTER TABLE email_clientefornecedor RENAME COLUMN idclientefornecedor TO id_cliente_fornecedor;

ALTER TABLE movimentacao RENAME COLUMN idbasecliente TO id_base_cliente;
ALTER TABLE movimentacao RENAME COLUMN idloja TO id_loja;
ALTER TABLE movimentacao RENAME COLUMN idcategoria TO id_categoria;
ALTER TABLE movimentacao RENAME COLUMN idmetodopagamento TO id_metodo_pagamento;
ALTER TABLE movimentacao RENAME COLUMN idclientefornecedor TO id_cliente_fornecedor;

ALTER TABLE fechamentoloja RENAME COLUMN idbasecliente TO id_base_cliente;
ALTER TABLE fechamentoloja RENAME COLUMN idloja TO id_loja;

ALTER TABLE itemmovimentacaofechamento RENAME COLUMN idfechamentoloja TO id_fechamento_loja;
ALTER TABLE itemmovimentacaofechamento RENAME COLUMN idmovimentacao TO id_movimentacao;

ALTER TABLE metaloja RENAME COLUMN idbasecliente TO id_base_cliente;
ALTER TABLE metaloja RENAME COLUMN idloja TO id_loja;

ALTER TABLE convite RENAME COLUMN idbasecliente TO id_base_cliente;
ALTER TABLE convite RENAME COLUMN criadopor TO criado_por;
ALTER TABLE convite RENAME COLUMN usadopor TO usado_por;

ALTER TABLE contratobase RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE modelocontrato RENAME COLUMN idbasecliente TO id_base_cliente;

ALTER TABLE anotacaobase RENAME COLUMN idbasecliente TO id_base_cliente;
ALTER TABLE anotacaobase RENAME COLUMN criadopor TO criado_por;

ALTER TABLE permissaobase RENAME COLUMN idbasecliente TO id_base_cliente;
ALTER TABLE permissaobase RENAME COLUMN idusuario TO id_usuario;
ALTER TABLE permissaobase RENAME COLUMN idpermissao TO id_permissao;

-- Corrigir referências de chaves estrangeiras após renomeação de colunas
ALTER TABLE basecliente DROP CONSTRAINT fk_basecliente_criador;
ALTER TABLE basecliente ADD CONSTRAINT fk_basecliente_criador FOREIGN KEY (id_criador) REFERENCES usuario(id);

ALTER TABLE acessousuariobase DROP CONSTRAINT unique_user_base;
ALTER TABLE acessousuariobase ADD CONSTRAINT unique_user_base UNIQUE(id_usuario, id_base_cliente);

ALTER TABLE endereco_clientefornecedor DROP CONSTRAINT endereco_clientefornecedor_idclientefornecedor_fkey;
ALTER TABLE endereco_clientefornecedor ADD FOREIGN KEY (id_cliente_fornecedor) REFERENCES clientefornecedor(id);

ALTER TABLE telefone_clientefornecedor DROP CONSTRAINT telefone_clientefornecedor_idclientefornecedor_fkey;
ALTER TABLE telefone_clientefornecedor ADD FOREIGN KEY (id_cliente_fornecedor) REFERENCES clientefornecedor(id);

ALTER TABLE email_clientefornecedor DROP CONSTRAINT email_clientefornecedor_idclientefornecedor_fkey;
ALTER TABLE email_clientefornecedor ADD FOREIGN KEY (id_cliente_fornecedor) REFERENCES clientefornecedor(id);

ALTER TABLE movimentacao DROP CONSTRAINT movimentacao_idbasecliente_fkey;
ALTER TABLE movimentacao ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE movimentacao DROP CONSTRAINT movimentacao_idloja_fkey;
ALTER TABLE movimentacao ADD FOREIGN KEY (id_loja) REFERENCES loja(id);

ALTER TABLE movimentacao DROP CONSTRAINT movimentacao_idcategoria_fkey;
ALTER TABLE movimentacao ADD FOREIGN KEY (id_categoria) REFERENCES categoria(id);

ALTER TABLE movimentacao DROP CONSTRAINT movimentacao_idmetodopagamento_fkey;
ALTER TABLE movimentacao ADD FOREIGN KEY (id_metodo_pagamento) REFERENCES metodopagamento(id);

ALTER TABLE movimentacao DROP CONSTRAINT movimentacao_idclientefornecedor_fkey;
ALTER TABLE movimentacao ADD FOREIGN KEY (id_cliente_fornecedor) REFERENCES clientefornecedor(id);

ALTER TABLE fechamentoloja DROP CONSTRAINT fechamentoloja_idbasecliente_fkey;
ALTER TABLE fechamentoloja ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE fechamentoloja DROP CONSTRAINT fechamentoloja_idloja_fkey;
ALTER TABLE fechamentoloja ADD FOREIGN KEY (id_loja) REFERENCES loja(id);

ALTER TABLE itemmovimentacaofechamento DROP CONSTRAINT itemmovimentacaofechamento_idfechamentoloja_fkey;
ALTER TABLE itemmovimentacaofechamento ADD FOREIGN KEY (id_fechamento_loja) REFERENCES fechamentoloja(id);

ALTER TABLE itemmovimentacaofechamento DROP CONSTRAINT itemmovimentacaofechamento_idmovimentacao_fkey;
ALTER TABLE itemmovimentacaofechamento ADD FOREIGN KEY (id_movimentacao) REFERENCES movimentacao(id);

ALTER TABLE metaloja DROP CONSTRAINT metaloja_idbasecliente_fkey;
ALTER TABLE metaloja ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE metaloja DROP CONSTRAINT metaloja_idloja_fkey;
ALTER TABLE metaloja ADD FOREIGN KEY (id_loja) REFERENCES loja(id);

ALTER TABLE convite DROP CONSTRAINT convite_idbasecliente_fkey;
ALTER TABLE convite ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE convite DROP CONSTRAINT convite_criadopor_fkey;
ALTER TABLE convite ADD FOREIGN KEY (criado_por) REFERENCES usuario(id);

ALTER TABLE convite DROP CONSTRAINT convite_usadopor_fkey;
ALTER TABLE convite ADD FOREIGN KEY (usado_por) REFERENCES usuario(id);

ALTER TABLE contratobase DROP CONSTRAINT contratobase_idbasecliente_fkey;
ALTER TABLE contratobase ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE modelocontrato DROP CONSTRAINT modelocontrato_idbasecliente_fkey;
ALTER TABLE modelocontrato ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE anotacaobase DROP CONSTRAINT anotacaobase_idbasecliente_fkey;
ALTER TABLE anotacaobase ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE anotacaobase DROP CONSTRAINT anotacaobase_criadopor_fkey;
ALTER TABLE anotacaobase ADD FOREIGN KEY (criado_por) REFERENCES usuario(id);

ALTER TABLE permissaobase DROP CONSTRAINT permissaobase_idbasecliente_fkey;
ALTER TABLE permissaobase ADD FOREIGN KEY (id_base_cliente) REFERENCES basecliente(id);

ALTER TABLE permissaobase DROP CONSTRAINT permissaobase_idusuario_fkey;
ALTER TABLE permissaobase ADD FOREIGN KEY (id_usuario) REFERENCES usuario(id);

ALTER TABLE permissaobase DROP CONSTRAINT permissaobase_idpermissao_fkey;
ALTER TABLE permissaobase ADD FOREIGN KEY (id_permissao) REFERENCES listapermissao(id);
