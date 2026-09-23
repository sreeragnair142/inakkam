import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCMo2Q3GGSBkcEqlRlbJXPwYehsdYUcdkg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "inakkam-cac46.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "inakkam-cac46",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "inakkam-cac46.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "290879856223",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:290879856223:web:63aaa4cd32f24ba22f45ea",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DESP2PW8ME",
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Keep recaptchaVerifier singleton
let recaptchaVerifierInstance = null;

/**
 * Initialize or reuse an invisible RecaptchaVerifier on a DOM element
 * @param {string} containerId - DOM element ID for reCAPTCHA
 */
export const getRecaptchaVerifier = (containerId = 'recaptcha-container') => {
  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch (e) {
      console.warn('Error clearing old recaptcha verifier:', e);
    }
    recaptchaVerifierInstance = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[Firebase] Element with ID "${containerId}" not found in DOM.`);
  }

  recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved automatically
    },
    'expired-callback': () => {
      console.warn('[Firebase] reCAPTCHA expired. Resetting verifier.');
      if (recaptchaVerifierInstance) {
        try {
          recaptchaVerifierInstance.clear();
        } catch (e) {}
        recaptchaVerifierInstance = null;
      }
    },
  });

  return recaptchaVerifierInstance;
};

/**
 * Send an SMS OTP using Firebase Phone Auth
 * @param {string} phoneNumber - E.164 formatted phone number (+919876543210)
 * @param {string} containerId - Container ID for invisible reCAPTCHA
 * @returns {Promise<ConfirmationResult>}
 */
export const sendFirebaseOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
  try {
    const verifier = getRecaptchaVerifier(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  } catch (err) {
    // Clear verifier on error so subsequent attempts can re-render
    if (recaptchaVerifierInstance) {
      try {
        recaptchaVerifierInstance.clear();
      } catch (e) {}
      recaptchaVerifierInstance = null;
    }
    throw err;
  }
};

/**
 * Confirm the OTP code and return the verified Firebase user ID token
 * @param {ConfirmationResult} confirmationResult
 * @param {string} otpCode
 * @returns {Promise<{ user: User, idToken: string, phone: string }>}
 */
export const verifyFirebaseOtp = async (confirmationResult, otpCode) => {
  if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
    throw new Error('No active OTP confirmation session found.');
  }

  const userCredential = await confirmationResult.confirm(otpCode);
  const user = userCredential.user;
  const idToken = await user.getIdToken(true);

  return {
    user,
    idToken,
    phone: user.phoneNumber,
  };
};

/**
 * Clear current reCAPTCHA widget safely
 */
export const clearRecaptcha = () => {
  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch (e) {}
    recaptchaVerifierInstance = null;
  }
};
