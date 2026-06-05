import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let googleProvider = null;

try {
  // Only initialize if we have actual values (not placeholders)
  const isConfigured = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "placeholder_api_key" &&
    firebaseConfig.authDomain &&
    firebaseConfig.authDomain !== "placeholder_auth_domain";

  if (isConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    console.warn("TokenLens Info: Firebase config is not fully set up. Real Firebase Auth is disabled. Please configure VITE_FIREBASE_* environment variables in Frontend/.env.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export { auth, googleProvider };
