// set-admin.js
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccountPath = "./serviceAccountKey.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`ERRO: Arquivo de chave de serviço não encontrado em '${serviceAccountPath}'.`);
  console.error("Baixe o arquivo do seu Console do Firebase (Configurações do Projeto > Contas de serviço) e salve-o na raiz do projeto.");
  process.exit(1);
}

// IMPORTANTE: Baixe este arquivo do seu Firebase Console
// Configurações do Projeto > Contas de serviço > Gerar nova chave privada
const serviceAccount = require(serviceAccountPath);

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
    console.log(`\n✅ Sucesso! O usuário com UID '${uid}' agora é um administrador da empresa '${companyId}'.`);
    console.log("O usuário precisa fazer logout e login novamente para que as alterações tenham efeito.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro ao definir as permissões (claims) do usuário:", error.message);
    console.error("Verifique se o UID do usuário está correto e se a sua conta de serviço tem as permissões necessárias.");
    process.exit(1);
  });
