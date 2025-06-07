import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa o Admin SDK apenas uma vez
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Função auxiliar para verificar se o chamador da função é um administrador.
 * Lança um HttpsError se o usuário não for autenticado ou não for admin.
 * @param {functions.https.CallableContext} context O contexto da função.
 * @returns {Promise<string>} O UID do chamador admin.
 */
const verifyAdmin = async (context: functions.https.CallableContext): Promise<string> => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "A função só pode ser chamada por usuários autenticados."
    );
  }
  const callerUid = context.auth.uid;
  const callerProfileSnap = await admin
    .database()
    .ref(`users/${callerUid}/profile`)
    .get();
    
  if (!callerProfileSnap.exists() || !callerProfileSnap.val().isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem executar esta ação."
    );
  }
  return callerUid;
};

export const createAdminUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. Verifica se o chamador é admin usando a função auxiliar
  await verifyAdmin(context);

  const { email, password, displayName } = data;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Dados incompletos (email, password, displayName são obrigatórios)."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false, // Por padrão, admins podem precisar verificar o email
    });

    const userProfile = {
      email: userRecord.email,
      displayName: userRecord.displayName,
      uid: userRecord.uid,
      isAdmin: true,
      clientBaseId: null,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      authDisabled: false,
    };

    await admin.database().ref(`users/${userRecord.uid}/profile`).set(userProfile);
    
    return {
      success: true,
      message: `Administrador "${displayName}" criado com sucesso.`,
      uid: userRecord.uid,
    };
  } catch (e: unknown) {
    const error = e as { code?: string; message?: string };
    console.error("Erro em createAdminUser:", error);
    // Fornece uma mensagem de erro mais específica se disponível
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError("already-exists", "O email fornecido já está em uso por outra conta.");
    }
    throw new functions.https.HttpsError("internal", error.message || "Erro desconhecido ao criar admin.");
  }
});

export const toggleUserAuthStatus = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. Verifica se o chamador é admin e obtém seu UID
  const callerUid = await verifyAdmin(context);

  const { targetUid, disable } = data;
  if (!targetUid || typeof disable !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UID do usuário alvo (targetUid) e o status (disable) são obrigatórios."
    );
  }

  if (callerUid === targetUid) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Administradores não podem desativar a própria conta através desta função."
    );
  }

  try {
    // Atualiza o status no Firebase Auth
    await admin.auth().updateUser(targetUid, { disabled: disable });

    // Atualiza o status no Realtime Database
    await admin.database().ref(`users/${targetUid}/profile/authDisabled`).set(disable);

    return {
      success: true,
      message: `Usuário ${targetUid} foi ${disable ? "desativado" : "ativado"} com sucesso.`,
    };
  } catch (e: unknown) {
    const error = e as { code?: string; message?: string };
    console.error("Erro ao tentar alterar status do usuário:", error);
    
    if (error.code === "auth/user-not-found") {
      throw new functions.https.HttpsError("not-found", "O usuário alvo não foi encontrado.");
    }
    
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Ocorreu um erro interno ao alterar o status do usuário."
    );
  }
});