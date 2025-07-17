# 📋 Migração Firebase → Supabase

## 🎯 Objetivo

Migrar de Firebase Realtime Database (NoSQL) para Supabase (PostgreSQL) mantendo todas as funcionalidades.

## 📊 Mapeamento de Dados

### Firebase (NoSQL) → Supabase (SQL)

#### 1. **users** (Coleção) → **users** (Tabela)

```sql
-- Tabela de usuários
CREATE SEQUENCE seq_usuario START 1;
CREATE TABLE usuario (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_usuario'),
  uidFirebase TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nomeExibicao TEXT,
  admin BOOLEAN DEFAULT FALSE,
  idBasePadrao INTEGER REFERENCES baseCliente(id),
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **clientBases** → **client_bases**

```sql
-- Tabela de bases de clientes
CREATE SEQUENCE seq_baseCliente START 1;
CREATE TABLE baseCliente (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_baseCliente'),
  nome TEXT NOT NULL,
  cnpj TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  limiteAcesso INTEGER,
  motivoInativa TEXT,
  idCriador INTEGER REFERENCES usuario(id),
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **authorizedUIDs** → **user_base_access**

```sql
-- Tabela de acesso de usuários às bases
CREATE SEQUENCE seq_acessoUsuarioBase START 1;
CREATE TABLE acessoUsuarioBase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_acessoUsuarioBase'),
  idUsuario INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  nomeExibicao TEXT,
  email TEXT,
  status TEXT DEFAULT 'ativo',
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idUsuario, idBaseCliente)
);
```

## 🛠️ Ferramentas Necessárias

1. **@supabase/supabase-js** - Cliente JavaScript
2. **Migração de dados** - Scripts de transferência
3. **Atualização do código** - Substituir Firebase por Supabase

---

### Tabelas de Lojas, Categorias, Métodos de Pagamento, Movimentações e Fechamentos

```sql
-- Tabela de lojas
CREATE SEQUENCE seq_loja START 1;
CREATE TABLE loja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_loja'),
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT,
  apelido TEXT,
  codigo TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE SEQUENCE seq_categoria START 1;
CREATE TABLE categoria (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_categoria'),
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  ativa BOOLEAN DEFAULT TRUE,
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métodos de pagamento
CREATE SEQUENCE seq_metodoPagamento START 1;
CREATE TABLE metodoPagamento (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_metodoPagamento'),
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de movimentações (transações)
CREATE SEQUENCE seq_movimentacao START 1;
CREATE TABLE movimentacao (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_movimentacao'),
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  idLoja INTEGER REFERENCES loja(id),
  idCategoria INTEGER REFERENCES categoria(id),
  idMetodoPagamento INTEGER REFERENCES metodoPagamento(id),
  descricao TEXT,
  valor NUMERIC(15,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  dataMovimentacao DATE NOT NULL,
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fechamentos de loja
CREATE SEQUENCE seq_fechamentoLoja START 1;
CREATE TABLE fechamentoLoja (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_fechamentoLoja'),
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  idLoja INTEGER REFERENCES loja(id) ON DELETE CASCADE,
  dataFechamento DATE NOT NULL,
  saldoInicial NUMERIC(15,2) NOT NULL,
  saldoFinal NUMERIC(15,2) NOT NULL,
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de movimentação do fechamento
CREATE SEQUENCE seq_itemMovimentacaoFechamento START 1;
CREATE TABLE itemMovimentacaoFechamento (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_itemMovimentacaoFechamento'),
  idFechamentoLoja INTEGER REFERENCES fechamentoLoja(id) ON DELETE CASCADE,
  idMovimentacao INTEGER REFERENCES movimentacao(id),
  valor NUMERIC(15,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Como pegar o próximo valor do id (nextval)

```sql
SELECT nextval('seq_usuario');
SELECT nextval('seq_baseCliente');
SELECT nextval('seq_acessoUsuarioBase');
SELECT nextval('seq_loja');
SELECT nextval('seq_categoria');
SELECT nextval('seq_metodoPagamento');
SELECT nextval('seq_movimentacao');
SELECT nextval('seq_fechamentoLoja');
SELECT nextval('seq_itemMovimentacaoFechamento');
SELECT nextval('seq_listaPermissao');
SELECT nextval('seq_permissaoBase');
```

---

### Tabelas de Permissões

```sql
-- Tabela de lista de permissões
CREATE SEQUENCE seq_listaPermissao START WITH 1;
CREATE TABLE listaPermissao (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_listaPermissao'),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de permissões por base/usuário
CREATE SEQUENCE seq_permissaoBase START WITH 1;
CREATE TABLE permissaoBase (
  id INTEGER PRIMARY KEY DEFAULT nextval('seq_permissaoBase'),
  idBaseCliente INTEGER REFERENCES baseCliente(id) ON DELETE CASCADE,
  idUsuario INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  idPermissao INTEGER REFERENCES listaPermissao(id),
  nomePermissao TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);
```

## 📝 Próximos Passos

1. ✅ Configurar projeto Supabase
2. ✅ Criar schema SQL completo
3. ✅ Instalar dependências
4. ✅ Criar funções de migração de dados
5. ✅ Atualizar hooks e componentes
6. ✅ Testar funcionalidades
7. ✅ Deploy e validação

## ⚠️ Considerações

- **Backup completo** do Firebase antes da migração
- **Teste em ambiente de desenvolvimento** primeiro
- **Migração gradual** por módulos
- **Validação de integridade** dos dados migrados
