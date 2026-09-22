import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMo2Q3GGSBkcEqlRlbJXPwYehsdYUcdkg",
  authDomain: "inakkam-cac46.firebaseapp.com",
  projectId: "inakkam-cac46",
  storageBucket: "inakkam-cac46.firebasestorage.app",
  messagingSenderId: "290879856223",
  appId: "1:290879856223:web:63aaa4cd32f24ba22f45ea",
  measurementId: "G-DESP2PW8ME"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export default app;
