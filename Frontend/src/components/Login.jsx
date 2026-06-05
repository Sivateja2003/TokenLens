import React, { useState } from "react";
import { Key, LogIn, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { loginWithGoogle, loading, error, isFirebaseConfigured } = useAuth();
  const [localError, setLocalError] = useState("");


  const handleGoogleLogin = async () => {
    setLocalError("");
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#0a0a0b",
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(124, 109, 240, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(192, 132, 252, 0.12) 0%, transparent 45%)
      `,
      padding: "1rem",
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      
      {/* Background Animated Blobs */}
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "#7c6df0",
        filter: "blur(120px)",
        opacity: 0.12,
        top: "15%",
        left: "25%",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "#c084fc",
        filter: "blur(140px)",
        opacity: 0.1,
        bottom: "15%",
        right: "25%",
        pointerEvents: "none"
      }} />

      {/* Login Card */}
      <div style={{
        width: "100%",
        maxWidth: "450px",
        background: "rgba(17, 17, 19, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "2.5rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        zIndex: 10
      }}>
        
        {/* TokenLens Key Logo */}
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #7c6df0, #c084fc)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 4px 20px rgba(124, 109, 240, 0.4)",
          marginBottom: "1.25rem",
        }}>
          <Key size={26} />
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "2rem",
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #f0f0f2, #c084fc)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textAlign: "center",
          marginBottom: "0.25rem"
        }}>
          TokenLens
        </h2>
        
        <p style={{
          fontSize: "0.85rem",
          color: "#9ca3af",
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          Real-Time Token Analytics & Cognitive Chat Console
        </p>

        {/* Error Alert Display */}
        {(error || localError) && (
          <div style={{
            width: "100%",
            backgroundColor: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.2)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            color: "#f87171"
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.15rem" }}>Authentication Error</div>
              <div style={{ fontSize: "0.78rem", lineHeight: 1.4, color: "#fca5a5" }}>{error || localError}</div>
            </div>
          </div>
        )}

        {/* Main Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.85rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            color: "white",
            background: "linear-gradient(135deg, #7c6df0, #c084fc)",
            boxShadow: "0 2px 10px rgba(124, 109, 240, 0.25)",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            marginBottom: "1.5rem"
          }}
          onMouseEnter={(e) => { if(!loading) e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Connecting to Google...
            </>
          ) : (
            <>
              <LogIn size={18} /> Sign In with Google
            </>
          )}
        </button>


        {/* Footer Info */}
        {!isFirebaseConfigured && (
          <p style={{
            fontSize: "0.72rem",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "1.75rem",
            lineHeight: "1.4"
          }}>
            Real Firebase Auth is disabled. Set VITE_FIREBASE_* environment variables in <code>Frontend/.env</code> to activate Google authentication.
          </p>
        )}

      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
