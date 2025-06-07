import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const createAdminUser = functions.https.onCall(async (data, context) => {
  // ... (código da sua função createAdminUser)
  // Verificação de autenticação e admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "A função só pode ser chamada por usuários autenticados."
    );
  }
  const callerUid = context.auth.uid;
  const callerProfileSnap = await admin.database().ref(`users/${callerUid}/profile`).get();
  if (!callerProfileSnap.exists() || !callerProfileSnap.val().isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem executar esta ação."
    );
  }

  const { email, password, displayName } = data;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError("invalid-argument", "Dados incompletos.");
  }
  // ... (restante da lógica de createAdminUser)
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false,
    });
    const userProfile = {
      email: userRecord.email,
      displayName: userRecord.displayName,
      uid: userRecord.uid,
      isAdmin: true,
      clientBaseId: null,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      authDisabled: false, // Novo usuário admin é criado ativo
    };
    await admin.database().ref(`users/${userRecord.uid}/profile`).set(userProfile);
    return { success: true, message: `Administrador "${displayName}" criado.`, uid: userRecord.uid };
  } catch (e: unknown) {
    const error = e as { message?: string };
    console.error("Erro em createAdminUser:", error.message || e);
    throw new functions.https.HttpsError("internal", error.message || "Erro desconhecido ao criar admin.");
  }
});


// Nova função para ativar/inativar usuário
export const toggleUserAuthStatus = functions.https.onCall(async (data, context) => {
  // 1. Verificar se o chamador está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "A função só pode ser chamada por usuários autenticados."
    );
  }

  // 2. Verificar se o chamador é um administrador
  const callerUid = context.auth.uid;
  const callerProfileSnap = await admin.database().ref(`users/${callerUid}/profile`).get();
  if (!callerProfileSnap.exists() || !callerProfileSnap.val().isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem alterar o status de outros usuários."
    );
  }

  const { targetUid, disable } = data; // disable será true para desativar, false para ativar

  // 3. Validar os dados de entrada
  if (!targetUid || typeof disable !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UID do usuário alvo e status de desativação são obrigatórios."
    );
  }

  // 4. Impedir que um admin se auto-desative por esta função (opcional, mas seguro)
  if (callerUid === targetUid) {
      throw new functions.https.HttpsError(
          "failed-precondition",
          "Administradores não podem desativar a própria conta através desta função."
      );
  }

  try {
    // 5. Atualizar o status do usuário no Firebase Authentication
    await admin.auth().updateUser(targetUid, {
      disabled: disable,
    });

    // 6. Atualizar o campo 'authDisabled' no perfil do usuário no Realtime Database
    // Este campo é a "coluna de ativo" que você mencionou para o RTDB
    const userProfileRef = admin.database().ref(`users/${targetUid}/profile/authDisabled`);
    await userProfileRef.set(disable);

    return {
      success: true,
      message: `Usuário ${targetUid} foi ${disable ? "desativado" : "ativado"} com sucesso.`,
    };
  } catch (e: unknown) {
    const error = e as { code?: string; message?: string };
    console.error("Erro ao tentar alterar status do usuário:", error.message || e);
    if (error.code === "auth/user-not-found") { // Erros do Firebase Auth costumam ter 'code'
        throw new functions.https.HttpsError("not-found", "Usuário alvo não encontrado.");
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Ocorreu um erro interno ao tentar alterar o status do usuário."
    );
  }
});
