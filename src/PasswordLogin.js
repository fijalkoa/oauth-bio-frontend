import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./password.css";
import { Link, useNavigate } from "react-router-dom";
import FaceModal from "./components/faceModal/FaceModal";
import OAuthConsentScreen from "./components/OAuthConsentScreen";
import { storeTokens } from "./services/authService";
import { initiateOIDCFlow } from "./services/oidcService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

export default function PasswordLogin() {
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showConsentScreen, setShowConsentScreen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [oauthConfig, setOauthConfig] = useState(null);
  const [loginData, setLoginData] = useState(null);
  const navigate = useNavigate();

  const handleConsentApprove = async () => {
    try {
      // Store OAuth config for use in callback handler
      if (oauthConfig) {
        sessionStorage.setItem("oauth_client_id", oauthConfig.clientId);
        sessionStorage.setItem("oauth_auth_endpoint", oauthConfig.authEndpoint);
        sessionStorage.setItem("oauth_redirect_uri", oauthConfig.redirectUri);
        sessionStorage.setItem("oauth_scopes", JSON.stringify(oauthConfig.scopes));
      }

      // Initiate OAuth flow (redirects to authorization server)
      await initiateOIDCFlow(
        oauthConfig.clientId,
        oauthConfig.authEndpoint,
        oauthConfig.redirectUri,
        oauthConfig.scopes
      );
    } catch (err) {
      console.error("Consent approval error:", err);
      setError(err.message || "Failed to initiate OAuth flow");
      setShowConsentScreen(false);
    }
  };

  const handleConsentDeny = () => {
    // User denied consent - store tokens locally without OAuth
    if (loginData) {
      storeTokens(
        loginData.access_token,
        loginData.id_token,
        loginData.refresh_token || null,
        loginData.expires_in || 3600,
        {
          email: email,
          name: loginData.user_name,
        }
      );
    }

    setShowConsentScreen(false);
    navigate("/home");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Login failed: ${response.status}`);
      }

      // Check if biometric verification is required
      if (data.requires_biometric) {
        // Biometric verification required - show face modal
        setRequiresBiometric(true);
        setLoginData(data);
        setShowFaceModal(true);
      } else if (data.access_token) {
        // Login successful - check if OAuth is needed
        setLoginData(data);

        if (data.consent_required || data.oauth_required) {
          // OAuth authentication required - show consent screen
          setOauthConfig({
            clientId: data.oauth_client_id || process.env.REACT_APP_OAUTH_CLIENT_ID,
            authEndpoint: data.oauth_auth_endpoint || process.env.REACT_APP_OAUTH_AUTH_ENDPOINT,
            redirectUri: `${window.location.origin}/oauth/callback`,
            scopes: data.oauth_scopes || ["openid", "profile", "email", "biometric"],
          });
          setShowConsentScreen(true);
        } else {
          // Direct login - store tokens and redirect
          storeTokens(
            data.access_token,
            data.id_token,
            data.refresh_token || null,
            data.expires_in || 3600,
            {
              email: email,
              name: data.user_name,
            }
          );

          // Check for redirect URL from backend
          if (data.redirect_url) {
            window.location.href = data.redirect_url;
          } else {
            navigate("/home");
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

    return (
        <div className="password-login-container">

            {/* Top-left icon with text */}
            <div className="logo-container">
                <img src="/images/green-leaf-icon.svg" alt="BioSSO icon" className="logo-icon" />
                <span className="logo-text">BioSSO</span>
            </div>

            <div className="login-card">
                <h1>Sign in</h1>
                <p>
                    to continue to <span className="text-success">calendar-app</span>
                </p>

                {error && <div className="alert alert-danger" role="alert">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group mb-2">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-control"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* "Don't remember password?" right below password input */}
                    <div className="forgot-password">
                        <Link to="/forgot-password" className="forgot-link">
                            Don’t remember password? ↗
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-continue" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Continue"}
                    </button>

                    <hr />

                    {/* Two buttons side by side below Continue */}
                    <div className="extra-buttons">
                        <Link to="/signup" className="btn btn-secondary">
                            Create New Account
                        </Link>
                        <button
                            type="button"
                            className="btn btn-face"
                            onClick={() => {
                                if (!email.trim()) {
                                    setError("Please enter your email address first");
                                    return;
                                }
                                setShowFaceModal(true);
                            }}
                            disabled={isLoading}
                        >
                            Use face option ↗
                        </button>
                    </div>
                </form>
            </div>

            {/* Render FaceModal if visible */}
            {showFaceModal && (
                <FaceModal
                    title={requiresBiometric ? "Verify Your Identity with Face" : "Sign in with Face"}
                    onClose={() => {
                        setShowFaceModal(false);
                        setRequiresBiometric(false);
                    }}
                    altAction={() => {
                        setShowFaceModal(false);
                        setRequiresBiometric(false);
                    }}
                    altActionLabel="Use password instead"
                    mode="login"
                    userId={email}
                />
            )}

            {/* Render OAuthConsentScreen if visible */}
            {showConsentScreen && oauthConfig && (
                <OAuthConsentScreen
                    scopes={oauthConfig.scopes}
                    onApprove={handleConsentApprove}
                    onDeny={handleConsentDeny}
                />
            )}
        </div>
    );
}
