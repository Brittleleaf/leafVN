import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIvhQ-FPqOcvWwY1z5wp4bye7UwUovLIU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "leaf-vn.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "leaf-vn",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "leaf-vn.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "661182351179",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:661182351179:web:9255ac31a8c3837f680ace",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CVL76YPDYM",
};

// Inicialización segura para SSR / Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Proveedor de Google con soporte opcional para Google Drive
export const googleProvider = new GoogleAuthProvider();
// Scope opcional para crear y guardar archivos del proyecto en Google Drive sin leer datos ajenos
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Proveedor de GitHub
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export default app;
