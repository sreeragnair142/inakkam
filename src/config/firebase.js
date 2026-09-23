import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCMo2Q3GGSBkcEqlRlbJXPwYehsdYUcdkg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "inakkam-cac46.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "inakkam-cac46",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "inakkam-cac46.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "290879856223",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:290879856223:web:63aaa4cd32f24ba22f45ea",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DESP2PW8ME"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export default app;
