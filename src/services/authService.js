/**
 * Authentication Service
 * Handles JWT/OIDC token storage, refresh, and session management
 */

import { getCSRFHeaders, clearCSRFToken } from "./csrfService";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "biosso_access_token",
  REFRESH_TOKEN: "biosso_refresh_token",
  ID_TOKEN: "biosso_id_token",
  USER_INFO: "biosso_user_info",
  TOKEN_EXPIRES: "biosso_token_expires",
};

/**
 * Store tokens after successful authentication
 * @param {string} accessToken - JWT access token
 * @param {string} idToken - OIDC ID token
 * @param {string} refreshToken - Refresh token (optional)
 * @param {number} expiresIn - Token expiry in seconds
 * @param {Object} userInfo - User profile data
 */
export function storeTokens(accessToken, idToken, refreshToken, expiresIn, userInfo) {
  const expiresAt = Date.now() + expiresIn * 1000;

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toString());

  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  if (userInfo) {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  console.log("✅ Tokens stored, expires at:", new Date(expiresAt));
}

/**
 * Get access token from storage
 * @returns {string|null} - Access token or null if not available
 */
export function getAccessToken() {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) return null;

  // Check if token is expired
  if (isTokenExpired()) {
    console.warn("⚠️ Token expired, clearing storage");
    clearTokens();
    return null;
  }

  return token;
}

/**
 * Get ID token
 * @returns {string|null} - ID token or null
 */
export function getIdToken() {
  const token = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  if (!token) return null;

  if (isTokenExpired()) {
    clearTokens();
    return null;
  }

  return token;
}

/**
 * Get user info from storage
 * @returns {Object|null} - User profile or null
 */
export function getUserInfo() {
  const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * Check if token is expired
 * @returns {boolean} - True if expired
 */
export function isTokenExpired() {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);
  if (!expiresAt) return true;

  return Date.now() > parseInt(expiresAt);
}

/**
 * Get time until token expires (in milliseconds)
 * @returns {number} - Milliseconds until expiry, or 0 if expired
 */
export function getTimeUntilExpiry() {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);
  if (!expiresAt) return 0;

  const remaining = parseInt(expiresAt) - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Check if token should be refreshed (before it expires)
 * Refreshes if less than 5 minutes remaining
 * @returns {boolean} - True if should refresh now
 */
export function shouldRefreshToken() {
  const remaining = getTimeUntilExpiry();
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  return remaining > 0 && remaining < REFRESH_THRESHOLD;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if valid tokens exist
 */
export function isAuthenticated() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!accessToken) return false;

  return !isTokenExpired();
}

/**
 * Clear all tokens and user info (logout)
 */
export function clearTokens() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  clearCSRFToken(); // Clear CSRF token on logout
  console.log("✅ Tokens cleared");
}

/**
 * Refresh access token using refresh token
 * @returns {Promise<Object>} - New tokens
 */
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getCSRFHeaders(), // Add CSRF token
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "include",
    });

    if (!response.ok) {
      clearTokens();
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    storeTokens(
      data.access_token,
      data.id_token,
      data.refresh_token || refreshToken,
      data.expires_in,
      data.user_info
    );

    return data;
  } catch (error) {
    clearTokens();
    throw error;
  }
}

/**
 * Get Authorization header for API requests
 * @returns {Object} - Header object with Bearer token
 */
export function getAuthHeaders() {
  const token = getAccessToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Decode JWT token (basic decoding, doesn't verify signature)
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}
