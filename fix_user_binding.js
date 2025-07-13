// Script para corrigir vinculação do usuário no Firebase
// Execute este script no console do navegador na página do Firebase Console

// ANÁLISE DOS USUÁRIOS ENCONTRADOS:
// 1. Wkr17AIRrreo8HjD7el9HEfj2TD3 - zalasik@gmail.com (usuário real)
// 2. user_1752436167170_vh9kpwphl - zalasik@gmail.com (usuário temporário)
// 3. lFRdGTMCgFUbd5JYywR3aCqpu7S2 - nzalasik@gmail.com (usuário anterior)

// VERIFICAR NO CONSOLE qual UID está logando:
console.log("🔍 Verificando usuário atual nos logs do useAuth");

// PASSOS PARA CORREÇÃO:

// OPÇÃO 1: Se o usuário logando é Wkr17AIRrreo8HjD7el9HEfj2TD3
const correctUID_option1 = "Wkr17AIRrreo8HjD7el9HEfj2TD3";
const baseId = "-OSC1jiQzr8FMnQbyZIj";
const userData = {
  displayName: "Nicolas teste",
  email: "zalasik@gmail.com"
};

console.log("🔧 OPÇÃO 1 - Vincular usuário real:");
console.log("Base ID:", baseId);
console.log("User UID:", correctUID_option1);
console.log("User Data:", userData);

// OPÇÃO 2: Se o usuário logando é lFRdGTMCgFUbd5JYywR3aCqpu7S2
const correctUID_option2 = "lFRdGTMCgFUbd5JYywR3aCqpu7S2";
const userData2 = {
  displayName: "Nicolas teste",
  email: "nzalasik@gmail.com"
};

console.log("🔧 OPÇÃO 2 - Vincular usuário anterior:");
console.log("Base ID:", baseId);
console.log("User UID:", correctUID_option2);
console.log("User Data:", userData2);

// INSTRUÇÕES:
// 1. Primeiro verifique nos logs do console qual UID está aparecendo no useAuth
// 2. Acesse: https://console.firebase.google.com/project/financeiro-597c4/database/financeiro-597c4-default-rtdb/data
// 3. Navegue até: clientBases/-OSC1jiQzr8FMnQbyZIj/authorizedUIDs
// 4. REMOVA todas as chaves antigas (user_1752429233814_b2b2f14zt, etc.)
// 5. Adicione uma nova chave com o UID correto (que aparece nos logs)
// 6. Defina o valor correspondente ao email do usuário

// ESTRUTURA ESPERADA:
// clientBases/
//   -OSC1jiQzr8FMnQbyZIj/
//     authorizedUIDs/
//       [UID_CORRETO]:
//         displayName: "Nicolas teste"
//         email: "[email_correto]"
