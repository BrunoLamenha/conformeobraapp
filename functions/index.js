const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function para criar/atualizar usuários e definir suas permissões (claims).
// Apenas usuários autenticados com a claim 'role: "admin"' podem chamar esta função.
exports.setUserClaims = functions
  .region("southamerica-east1") // Use a mesma região do seu Firestore
  .https.onCall(async (data, context) => {
    // 1. Validação de Permissão: Garante que o chamador é um admin.
    if (context.auth.token.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas administradores podem executar esta operação."
      );
    }

    // 2. Extração dos dados recebidos do app.
    const { email, companyId, role } = data;
    if (!email || !companyId || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A função deve ser chamada com 'email', 'companyId' e 'role'."
      );
    }

    // 3. Busca ou cria o usuário no Firebase Authentication.
    let userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      userRecord = await admin.auth().createUser({ email });
    }

    // 4. Define as permissões customizadas (claims) para o usuário.
    await admin.auth().setCustomUserClaims(userRecord.uid, { companyId, role });

    return { success: true, uid: userRecord.uid };
  });