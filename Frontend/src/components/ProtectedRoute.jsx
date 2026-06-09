import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import AuthPage from "../AuthPage";
import LandingPage from "./LandingPage";

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#0a0a0b",
        color: "#9ca3af",
        gap: "1rem",
        fontFamily: "'Inter', sans-serif"
      }}>
        <Loader2 size={36} className="spin-animation" style={{ animation: "spin 1s linear infinite", color: "#7c6df0" }} />
        <span style={{ fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.025em" }}>
          Validating TokenLens session context...
        </span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user || !token) {
    if (showLogin) {
      return <AuthPage onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLogin={() => setShowLogin(true)} onGetStarted={() => setShowLogin(true)} />;
  }

  return children;
}
