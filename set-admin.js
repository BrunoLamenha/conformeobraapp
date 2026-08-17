// set-admin.js
const admin = require("firebase-admin");

// IMPORTANTE: Baixe este arquivo do seu Firebase Console
// Configurações do Projeto > Contas de serviço > Gerar nova chave privada
const serviceAccount = require("./serviceAccountKey.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = process.argv[2];
const companyId = process.argv[3];

if (!uid || !companyId) {
  console.error("ERRO: Forneça o UID do usuário e o ID da empresa.");
  console.log("Uso: node set-admin.js <UID_DO_USUARIO> <ID_DA_EMPRESA>");
  process.exit(1);
}

// Define os custom claims para o usuário
admin.auth().setCustomUserClaims(uid, { role: "admin", companyId: companyId })
  .then(() => {
    console.log(`✅ Sucesso! O usuário ${uid} agora é um administrador da empresa ${companyId}.`);
    console.log("O usuário precisa fazer logout e login novamente para que as alterações tenham efeito.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao definir claims:", error);
    process.exit(1);
  });
