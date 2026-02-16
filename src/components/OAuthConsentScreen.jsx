/**
 * OAuth2 Consent Screen
 * Shows user what permissions the application is requesting
 */
import React, { useState } from "react";
import "./OAuthConsentScreen.css";

export default function OAuthConsentScreen({
  appName = "Calendar App",
  appLogo = "/images/green-leaf-icon.svg",
  requestedScopes = ["openid", "profile", "email", "biometric"],
  onConsent,
  onDeny,
  isLoading = false,
}) {
  const [agreedToAll, setAgreedToAll] = useState(false);

  // Map scopes to readable descriptions
  const scopeDescriptions = {
    openid: {
      icon: "🔑",
      title: "OpenID Authentication",
      description: "Verify your identity",
    },
    profile: {
      icon: "👤",
      title: "Profile Information",
      description: "Access your name, avatar, and basic profile data",
    },
    email: {
      icon: "✉️",
      title: "Email Address",
      description: "Access your email address",
    },
    biometric: {
      icon: "👆",
      title: "Biometric Data",
      description: "Access your facial biometric data for identification",
    },
  };

  const handleConsent = () => {
    if (agreedToAll) {
      onConsent?.();
    }
  };

  return (
    <div className="oauth-overlay">
      <div className="consent-container">
        <div className="consent-header">
          <div className="consent-app-info">
            <img src={appLogo} alt={appName} className="consent-logo" />
            <div>
              <h1 className="consent-app-name">{appName}</h1>
              <p className="consent-subtitle">is requesting access to:</p>
            </div>
          </div>
        </div>

        <div className="consent-scopes">
          {requestedScopes.map((scope) => {
            const scopeInfo = scopeDescriptions[scope] || {
              icon: "📋",
              title: scope,
              description: `Access to ${scope}`,
            };

            return (
              <div key={scope} className="scope-item">
                <span className="scope-icon">{scopeInfo.icon}</span>
                <div className="scope-content">
                  <h3 className="scope-title">{scopeInfo.title}</h3>
                  <p className="scope-description">{scopeInfo.description}</p>
                </div>
                <span className="scope-check">✓</span>
              </div>
            );
          })}
        </div>

        <div className="consent-info">
          <p className="info-text">
            By approving, you allow <strong>{appName}</strong> to access the information above.
          </p>
          <p className="info-text privacy-text">
            You can manage your permissions at any time in your account settings.
          </p>
        </div>

        <div className="consent-agreement">
          <input
            type="checkbox"
            id="agree-checkbox"
            checked={agreedToAll}
            onChange={(e) => setAgreedToAll(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="agree-checkbox" className="agreement-label">
            I understand and agree to allow {appName} access to the above information
          </label>
        </div>

        <div className="consent-actions">
          <button
            className="btn btn-deny"
            onClick={onDeny}
            disabled={isLoading}
          >
            Deny
          </button>
          <button
            className="btn btn-approve"
            onClick={handleConsent}
            disabled={!agreedToAll || isLoading}
          >
            {isLoading ? "Processing..." : "Approve"}
          </button>
        </div>

        <p className="consent-footer">
          <small>
            By approving, you are redirecting to {appName}. BioSSO will not store
            your password or sensitive data on {appName}'s servers.
          </small>
        </p>
      </div>
    </div>
  );
}
