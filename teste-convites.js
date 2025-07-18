// Script de teste para o sistema de convites
// Execute no console do navegador para testar o fluxo

console.log("Iniciando teste do sistema de convites...");

// 1. Testar criação de convite
async function testarCriacaoConvite() {
  console.log("1. Testando criação de convite...");

  try {
    const response = await fetch("/api/create-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "teste@exemplo.com",
        nome: "Usuário Teste",
        admin: false,
        idbasepadrao: 1,
      }),
    });

    const result = await response.json();
    console.log("Convite criado:", result);
    return result.inviteLink;
  } catch (error) {
    console.error("Erro ao criar convite:", error);
  }
}

// 2. Testar validação de convite
async function testarValidacaoConvite(token) {
  console.log("2. Testando validação de convite...");

  try {
    // Simular o que acontece quando usuário acessa o link
    const params = new URLSearchParams();
    params.set("token", token);

    console.log("Token para teste:", token);
    console.log("URL de teste:", `/invite?${params.toString()}`);

    return token;
  } catch (error) {
    console.error("Erro ao validar convite:", error);
  }
}

// 3. Executar teste completo
async function executarTeste() {
  const inviteLink = await testarCriacaoConvite();

  if (inviteLink) {
    const token = inviteLink.split("token=")[1];
    await testarValidacaoConvite(token);
  }
}

// Instruções de uso:
console.log(`
INSTRUÇÕES DE TESTE:

1. Abra o console do navegador (F12)
2. Cole e execute: executarTeste()
3. Ou teste manualmente:
   - Acesse http://localhost:8081/invite?token=SEU_TOKEN
   - Preencha os dados do formulário
   - Clique em "Ativar Conta"

FLUXO ESPERADO:
- Admin cria usuário → Gera convite
- Usuário acessa link → Define senha
- Status muda de PENDENTE → ATIVO
- Login automático e redirecionamento
`);

export { executarTeste, testarCriacaoConvite, testarValidacaoConvite };
