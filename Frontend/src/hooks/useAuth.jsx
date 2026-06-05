import React, { createContext, useContext, useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext(null);

const AUTH_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const loginWithGoogle = async () => {
    setError("");
    setLoading(true);
    
    if (!auth || !googleProvider) {
      setLoading(false);
      const errMsg = "Firebase Auth is not configured. Please set VITE_FIREBASE_* environment variables in Frontend/.env.";
      setError(errMsg);
      throw new Error(errMsg);
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await exchangeTokenForJWT(idToken);
    } catch (err) {
      let friendlyMsg = err.message || "Google Sign-In failed.";
      if (err.code === "auth/invalid-api-key" || err.code === "auth/api-key-not-valid") {
        friendlyMsg = "Firebase configuration is invalid. Please check your environment variables.";
      }
      setError(friendlyMsg);
      throw err;
    } finally {
      setLoading(false);
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
    error,
    loginWithGoogle,
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
