import * as admin from "firebase-admin";
import { https as v1Https, logger as v1Logger } from "firebase-functions/v1";
import { CallableContext } from "firebase-functions/v1/https";

// Inicializa o Firebase Admin SDK apenas uma vez.
// Isso é crucial para que suas funções possam interagir com outros serviços do Firebase
// (como Auth, Realtime Database, Firestore, etc.) no lado do servidor.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface DeleteUserAccountData {
  targetUid: string;
}

export const deleteUserAccount = v1Https.onCall(async (data: DeleteUserAccountData, context: CallableContext) => {
  // Lógica para verificar se o chamador é admin (usando sua função verifyAdmin)
  // const callerUid = await verifyAdmin(context);
  // v1Logger.info(`Admin ${callerUid} iniciando deleteUserAccount para usuário ${data.targetUid}`);

  const { targetUid } = data;

  if (!targetUid) {
    v1Logger.error("Tentativa de exclusão sem targetUid.");
    throw new v1Https.HttpsError(
      "invalid-argument",
      "UID do usuário alvo é obrigatório."
    );
  }

  // Exemplo de verificação para não se auto-excluir (se aplicável)
  // if (callerUid === targetUid) {
  //   v1Logger.warn(`Admin ${callerUid} tentou se auto-excluir.`);
  //   throw new v1Https.HttpsError(
  //     "failed-precondition",
  //     "Administradores não podem excluir a própria conta através desta função."
  //   );
  // }

  try {
    v1Logger.info(`Iniciando exclusão do usuário ${targetUid}.`);

    // 1. Excluir usuário do Firebase Authentication
    await admin.auth().deleteUser(targetUid);
    v1Logger.info(`Usuário ${targetUid} excluído do Firebase Auth.`);

    // 2. Excluir perfil do usuário do Realtime Database (ou Firestore)
    // Exemplo para Realtime Database:
    const userProfileRef = admin.database().ref(`users/${targetUid}`);
    await userProfileRef.remove();
    v1Logger.info(`Perfil do usuário ${targetUid} removido do RTDB.`);

    // 3. (Opcional) Remover o UID do usuário de outras estruturas de dados,
    //    como 'authorizedUIDs' em 'clientBases'
    const clientBasesRef = admin.database().ref("clientBases");
    const basesSnapshot = await clientBasesRef.once("value");
    if (basesSnapshot.exists()) {
      const updates: { [key: string]: null } = {};
      basesSnapshot.forEach((baseSnapshot) => {
        const baseData = baseSnapshot.val();
        if (baseData && baseData.authorizedUIDs && baseData.authorizedUIDs[targetUid]) {
          updates[`clientBases/${baseSnapshot.key}/authorizedUIDs/${targetUid}`] = null;
          v1Logger.info(`UID ${targetUid} marcado para remoção de authorizedUIDs na base ${baseSnapshot.key}.`);
        }
      });
      if (Object.keys(updates).length > 0) {
        await admin.database().ref().update(updates);
        v1Logger.info(`UID ${targetUid} removido de authorizedUIDs em clientBases.`);
      }
    }


    return { success: true, message: `Usuário ${targetUid} e seus dados associados foram excluídos com sucesso.` };
  } catch (error: any) {
    const unknownError = error as Error; // Asserção de tipo para Error
    let errorCode: string | undefined;
    // Tenta acessar 'code' de forma segura, comum em Firebase errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      errorCode = (error as { code: string }).code;
    
    }
    // Para outros erros, retorne um erro 'internal' genérico, mas o log detalhado estará no Firebase Console.
    v1Logger.error(`Erro ao excluir conta do usuário ${targetUid}:`, unknownError.message, errorCode, unknownError.stack);

    if (errorCode === "auth/user-not-found") {
      throw new v1Https.HttpsError("not-found", `Usuário alvo ${targetUid} não encontrado na Autenticação.`);
    }
    // Linha 95 original (aproximadamente)
    throw new v1Https.HttpsError("internal", unknownError.message || "Ocorreu um erro interno ao tentar excluir a conta do usuário.");
  }
});

/**
 * Exemplo de uma Cloud Function "Callable" (chamável).
 * Funções "Callable" são recomendadas para serem chamadas diretamente do seu aplicativo cliente (frontend).
 * Elas automaticamente desserializam o corpo da requisição e validam tokens de autenticação.
 *
 * @param data - Dados enviados pelo cliente.
 * @param context - Informações sobre a autenticação do usuário e a instância da função.
 * @returns Um objeto ou uma Promise que resolve para um objeto a ser enviado de volta ao cliente.
 */
export const helloWorld = v1Https.onCall((data: any, context: CallableContext) => {
  // Log para depuração. Você pode ver esses logs no console do Firebase em Functions > Registros.
  v1Logger.info("Função helloWorld chamada!", { structuredData: true, dataRecebida: data });

  // Exemplo de verificação de autenticação (opcional, mas comum)
  if (!context.auth) {
    // Lança um erro que será enviado de volta ao cliente.
    throw new v1Https.HttpsError(
      "unauthenticated",
      "A função só pode ser chamada por usuários autenticados."
    );
  }

  const text = data.text || "Olá do Firebase Functions (v1)!";
  const uid = context.auth.uid;

  return { message: `Usuário ${uid} disse: ${text}` };
});

// Adicione suas outras funções aqui, exportando cada uma delas.
// Por exemplo, as funções de administrador que estávamos desenvolvendo:
// export const createAdminUser = v1Https.onCall(async (data, context) => { /* ... */ });
// export const toggleUserAuthStatus = v1Https.onCall(async (data, context) => { /* ... */ });
// export const deleteUserAccount = v1Https.onCall(async (data, context) => { /* ... */ });