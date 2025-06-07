// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database"; // Importar getDatabase para RTDB
import { getAuth } from "firebase/auth"; // Importar getAuth para Autenticação
import { getStorage } from "firebase/storage"; // 1. Importar getStorage
import { getFunctions } from "firebase/functions"; // Importar getFunctions

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
