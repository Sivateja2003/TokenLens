import React, { createContext, useContext, useState, useEffect } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, getAdditionalUserInfo } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext(null);

const AUTH_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("tokenlens_token");
      const storedUser = localStorage.getItem("tokenlens_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Exchange Firebase ID Token or Mock Token for Backend JWT
  const exchangeTokenForJWT = async (idToken) => {
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Authentication with backend failed.");
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("tokenlens_token", data.token);
      localStorage.setItem("tokenlens_user", JSON.stringify(data.user));
      setError("");
      return data;
    } catch (err) {
      setError(err.message || "Backend login failure.");
      throw err;
    }
  };

  // Sign in using real Firebase Google auth
  const loginWithGoogle = async (isRegistering = false) => {
    setError("");
    setSubmitting(true);
    
    if (!auth || !googleProvider) {
      setSubmitting(false);
      const errMsg = "Firebase Auth is not configured. Please set VITE_FIREBASE_* environment variables in Frontend/.env.";
      setError(errMsg);
      throw new Error(errMsg);
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = !!additionalInfo?.isNewUser;
      
      if (isRegistering && isNewUser) {
        await auth.signOut();
        return { success: true, isNewUser: true };
      }

      const idToken = await result.user.getIdToken();
      await exchangeTokenForJWT(idToken);
      return { success: true, isNewUser: false };
    } catch (err) {
      let friendlyMsg = err.message || "Google Sign-In failed.";
      if (err.code === "auth/invalid-api-key" || err.code === "auth/api-key-not-valid") {
        friendlyMsg = "Firebase configuration is invalid. Please check your environment variables.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyMsg = "Google Sign-In is not enabled in your Firebase Console. Go to Authentication > Sign-in method, click Add New Provider, select Google, enable it, and save.";
      }
      setError(friendlyMsg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithEmail = async (email, password) => {
    setError("");
    setSubmitting(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      await exchangeTokenForJWT(idToken);
    } catch (err) {
      let friendlyMsg = err.message || "Email Sign-In failed.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        friendlyMsg = "Invalid email or password.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyMsg = "Email/Password sign-in is not enabled in your Firebase Console. Go to Authentication > Sign-in method, click Email/Password, enable it, and save.";
      }
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const signupWithEmail = async (email, password, name) => {
    setError("");
    setSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      await auth.signOut();
      return { success: true };
    } catch (err) {
      let friendlyMsg = err.message || "Email Sign-Up failed.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMsg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        friendlyMsg = "Password must be at least 6 characters.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyMsg = "Email/Password sign-in is not enabled in your Firebase Console. Go to Authentication > Sign-in method, click Email/Password, enable it, and save.";
      }
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (email, newPassword) => {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Password reset failed.");
      }
      return await response.json();
    } catch (err) {
      setError(err.message || "Password reset failed.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (err) {
      console.error("Firebase signout error:", err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("tokenlens_token");
      localStorage.removeItem("tokenlens_user");
      setError("");
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    submitting,
    error,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    resetPassword,
    logout,
    isFirebaseConfigured: !!(auth && googleProvider),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
