# Debug do Sistema de Convites

## Passos para Testar

1. **Criar usuário no Supabase Admin**:

   - Vá no painel Supabase > Authentication > Users
   - Clique "Add User"
   - Email: teste@exemplo.com
   - NÃO defina senha
   - Deixe "Auto Confirm User" marcado

2. **Criar convite no banco**:

```sql
INSERT INTO convite (email, nome, token, admin, status, criado_em, expira_em)
VALUES (
  'teste@exemplo.com',
  'Usuario Teste',
  'token_teste_123',
  false,
  'PENDENTE',
  NOW(),
  NOW() + INTERVAL '7 days'
);
```

3. **Criar usuário na tabela usuario**:

```sql
INSERT INTO usuario (email, nome, admin, status, criado_em)
VALUES (
  'teste@exemplo.com',
  'Usuario Teste',
  false,
  'PENDENTE',
  NOW()
);
```

4. **Testar link do convite**:
   http://localhost:8081/invite?token=token_teste_123

## Logs para Verificar

- Console do navegador (F12)
- Network tab para ver requests
- Supabase dashboard > Logs

## URLs que devem estar configuradas no Supabase

Authentication > URL Configuration > Redirect URLs:

- http://localhost:8081/reset-password
- http://localhost:8081/reset-password?\*

## Se o erro persistir

Verifique:

1. As URLs estão configuradas no Supabase?
2. O email template está correto?
3. O usuário foi criado sem senha no Auth?
4. A tabela usuario tem o registro PENDENTE?
5. A tabela convite tem o token válido?

## Comando para debug no console

```javascript
// No console do navegador
supabase.auth.getSession().then(console.log);
supabase.auth.getUser().then(console.log);
```
