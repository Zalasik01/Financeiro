// c:\Users\Usuario\Desktop\Financeiro\src\firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Se for usar autenticação, storage, etc., importe-os aqui também
// import { getAuth } from "firebase/auth";
// import { getStorage } from "firebase/storage";

// TODO: Substitua pelas suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
const db = getFirestore(app);

// Exporte as instâncias que você usará em outros lugares
export { db };
// export { auth, storage }; // Se for usar
