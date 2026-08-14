/**
 * CONFIGURAÇÃO DO FIREBASE
 * 
 * ⚠️ INSTRUÇÕES:
 * 
 * 1. Acesse https://console.firebase.google.com
 * 2. Clique em "Criar projeto" e preenchao nome (ex: conformeobraapp)
 * 3. Em "Firestore Database", clique em "Criar banco de dados"
 * 4. Escolha "Iniciar no modo de teste" (depois configuraremos as regras)
 * 5. Na seção "Configuração do projeto" (ícone de engrenagem > Configurações do projeto)
 * 6. Em "Suas aplicações", clique em "</>" para registrar um app web
 * 7. Copie o objeto firebaseConfig completo
 * 8. Renomeie este arquivo para "firebase-config.local.js"
 * 9. Substitua o objeto firebaseConfig abaixo pelos seus dados
 * 10. Pronto! O app usará seus dados do Firebase
 */

export const firebaseConfig = {
  apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYzABcDefG",  // ← SUBSTITUA AQUI
  authDomain: "seu-projeto.firebaseapp.com",          // ← SUBSTITUA AQUI
  projectId: "seu-projeto",                           // ← SUBSTITUA AQUI
  storageBucket: "seu-projeto.appspot.com",           // ← SUBSTITUA AQUI
  messagingSenderId: "123456789012",                  // ← SUBSTITUA AQUI
  appId: "1:123456789012:web:abcdef123456"           // ← SUBSTITUA AQUI
};

// ⚠️ NUNCA COMMITE ESTE ARQUIVO COM DADOS REAIS!
// O arquivo .gitignore vai ignorar firebase-config.local.js automaticamente
