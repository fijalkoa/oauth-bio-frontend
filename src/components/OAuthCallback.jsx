import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleOAuthCallback } from "../services/oidcService";
import { storeTokens } from "../services/authService";

/**
 * OAuth Callback Handler
 * Handles redirect from authorization server with authorization code
 */
function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code) {
          throw new Error("No authorization code received");
        }

        if (!state) {
          throw new Error("No state parameter received");
        }

        // Get configuration from sessionStorage or environment
        const clientId = sessionStorage.getItem("oauth_client_id") || 
                         process.env.REACT_APP_OAUTH_CLIENT_ID;
        const tokenEndpoint = sessionStorage.getItem("oauth_token_endpoint") || 
                              process.env.REACT_APP_OAUTH_TOKEN_ENDPOINT;
        const redirectUri = `${window.location.origin}/oauth/callback`;

        if (!clientId || !tokenEndpoint) {
          throw new Error("OAuth configuration missing");
        }

        // Exchange authorization code for tokens
        const tokens = await handleOAuthCallback(code, state, tokenEndpoint, clientId);

        // Store tokens
        storeTokens(
          tokens.access_token,
          tokens.id_token,
          tokens.refresh_token,
          tokens.expires_in,
          tokens.user_info
        );

        console.log("✅ OAuth callback processed successfully");

        // Redirect to home page
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err.message || "OAuth authentication failed");
        setLoading(false);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        {loading && !error && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔄</div>
            <h2>Processing OAuth callback...</h2>
            <p style={{ color: "#666" }}>Exchanging code for tokens...</p>
          </>
        )}

        {error && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
            <h2>Authentication Failed</h2>
            <p style={{ color: "#d32f2f" }}>{error}</p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;
