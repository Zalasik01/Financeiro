// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database"; // Importar getDatabase para RTDB
import { getAuth } from "firebase/auth"; // Importar getAuth para Autenticação
import { getStorage } from "firebase/storage"; // 1. Importar getStorage
import { getFunctions } from "firebase/functions"; // Importar getFunctions
import { env } from "@/config/env"; // Importar configuração validada

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  databaseURL: env.firebase.databaseURL,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  measurementId: env.firebase.measurementId,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Realtime Database and export it
const db = getDatabase(app);

export const storage = getStorage(app); // 2. Inicializar e exportar o storage

// Initialize Firebase Authentication and export it
const auth = getAuth(app);

// Initialize Firebase Functions and export it
const functions = getFunctions(app);

export { db, auth, app, functions }; // Exportar 'functions'
