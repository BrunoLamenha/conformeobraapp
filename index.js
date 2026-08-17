// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function para criar um usuário (se não existir) e definir seus custom claims.
 * Apenas administradores podem chamar esta função.
 */
exports.setUserClaims = functions
  .region("southamerica-east1") // Use a mesma região do seu Firestore
  .https.onCall(async (data, context) => {
    // 1. Verificar se o chamador é um administrador
    if (context.auth.token.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas administradores podem executar esta operação."
      );
    }

    const { email, companyId, role } = data;

    if (!email || !companyId || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email, companyId e role são obrigatórios."
      );
    }

    try {
      let userRecord = await admin.auth().getUserByEmail(email).catch(() => null);

      if (!userRecord) {
        userRecord = await admin.auth().createUser({ email });
      }

      await admin.auth().setCustomUserClaims(userRecord.uid, { companyId, role });

      return { success: true, uid: userRecord.uid };
    } catch (error) {
      console.error("Erro ao definir claims:", error);
      throw new functions.https.HttpsError("internal", "Ocorreu um erro ao processar a solicitação.");
    }
  });