import * as admin from "firebase-admin";
import { https as v1Https, logger as v1Logger } from "firebase-functions/v1";
import { CallableContext } from "firebase-functions/v1/https";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface DeleteUserAccountData {
  targetUid: string;
}

interface HelloWorldData {
  text?: string;
}

export const deleteUserAccount = v1Https.onCall(
  async (data: DeleteUserAccountData, context: CallableContext) => {
    const { targetUid } = data;

    if (!targetUid) {
      v1Logger.error("Tentativa de exclusão sem targetUid.");
      throw new v1Https.HttpsError(
        "invalid-argument",
        "UID do usuário alvo é obrigatório."
      );
    }

    try {
      v1Logger.info(`Iniciando exclusão do usuário ${targetUid}.`);

      await admin.auth().deleteUser(targetUid);
      v1Logger.info(`Usuário ${targetUid} excluído do Firebase Auth.`);

      const userProfileRef = admin.database().ref(`users/${targetUid}`);
      await userProfileRef.remove();
      v1Logger.info(`Perfil do usuário ${targetUid} removido do RTDB.`);

      const clientBasesRef = admin.database().ref("clientBases");
      const basesSnapshot = await clientBasesRef.once("value");
      if (basesSnapshot.exists()) {
        const updates: { [key: string]: null } = {};
        basesSnapshot.forEach((baseSnapshot) => {
          const baseData = baseSnapshot.val();
          if (
            baseData &&
            baseData.authorizedUIDs &&
            baseData.authorizedUIDs[targetUid]
          ) {
            updates[
              `clientBases/${baseSnapshot.key}/authorizedUIDs/${targetUid}`
            ] = null;
            v1Logger.info(
              `UID ${targetUid} marcado para remoção de authorizedUIDs na base ${baseSnapshot.key}.`
            );
          }
        });
        if (Object.keys(updates).length > 0) {
          await admin.database().ref().update(updates);
          v1Logger.info(
            `UID ${targetUid} removido de authorizedUIDs em clientBases.`
          );
        }
      }

      return {
        success: true,
        message: `Usuário ${targetUid} e seus dados associados foram excluídos com sucesso.`,
      };
    } catch (error) {
      const unknownError = error as Error;
      let errorCode: string | undefined;
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        errorCode = (error as { code: string }).code;
      }
      v1Logger.error(
        `Erro ao excluir conta do usuário ${targetUid}:`,
        unknownError.message,
        errorCode,
        unknownError.stack
      );

      if (errorCode === "auth/user-not-found") {
        throw new v1Https.HttpsError(
          "not-found",
          `Usuário alvo ${targetUid} não encontrado na Autenticação.`
        );
      }
      throw new v1Https.HttpsError(
        "internal",
        unknownError.message ||
          "Ocorreu um erro interno ao tentar excluir a conta do usuário."
      );
    }
  }
);

export const helloWorld = v1Https.onCall(
  (data: HelloWorldData, context: CallableContext) => {
    v1Logger.info("Função helloWorld chamada!", {
      structuredData: true,
      dataRecebida: data,
    });

    if (!context.auth) {
      throw new v1Https.HttpsError(
        "unauthenticated",
        "A função só pode ser chamada por usuários autenticados."
      );
    }

    const text = data.text || "Olá do Firebase Functions (v1)!";
    const uid = context.auth.uid;

    return { message: `Usuário ${uid} disse: ${text}` };
  }
);