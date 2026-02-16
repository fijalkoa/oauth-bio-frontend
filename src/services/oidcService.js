/**
 * OpenID Connect / OAuth2 Service
 * Handles OIDC authorization code flow with PKCE support
 */

/**
 * Crypto utilities for PKCE
 * Generate code_challenge from code_verifier
 */

// Generate random string for state and code_verifier
function generateRandomString(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// Base64URL encode (for PKCE)
function base64URLEncode(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate code_challenge from code_verifier (SHA256)
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(buffer);
}

// Storage keys
const OIDC_STORAGE_KEYS = {
  STATE: 'oidc_state',
  CODE_VERIFIER: 'oidc_code_verifier',
  NONCE: 'oidc_nonce',
  REQUEST_TIME: 'oidc_request_time',
};

/**
 * Initiate OIDC authorization code flow
 * @param {string} clientId - OAuth2 client ID
 * @param {string} authorizationEndpoint - e.g. http://localhost:8080/oauth2/authorize
 * @param {string} redirectUri - e.g. http://localhost:3000/oauth/callback
 * @param {Array<string>} scopes - e.g. ['openid', 'profile', 'email', 'biometric']
 * @returns {Promise<void>}
 */
export async function initiateOIDCFlow(
  clientId,
  authorizationEndpoint,
  redirectUri,
  scopes = ['openid', 'profile', 'email']
) {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Generate state and nonce for CSRF/replay protection
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // Store in sessionStorage (cleared on browser close)
    sessionStorage.setItem(OIDC_STORAGE_KEYS.STATE, state);
    sessionStorage.setItem(OIDC_STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(OIDC_STORAGE_KEYS.NONCE, nonce);
    sessionStorage.setItem(OIDC_STORAGE_KEYS.REQUEST_TIME, Date.now().toString());

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent', // Force consent screen
    });

    const authUrl = `${authorizationEndpoint}?${params.toString()}`;

    console.log('🔐 Redirecting to authorization endpoint:', authUrl);
    window.location.href = authUrl;
  } catch (error) {
    console.error('❌ OIDC flow error:', error);
    throw new Error('Failed to initiate OIDC flow: ' + error.message);
  }
}

/**
 * Handle OAuth2 callback (authorization code response)
 * Called after user authorizes and is redirected back
 * @param {string} code - Authorization code from redirect URL
 * @param {string} state - State parameter from redirect URL (for CSRF validation)
 * @param {string} tokenEndpoint - e.g. http://localhost:8080/oauth2/token
 * @param {string} clientId - OAuth2 client ID
 * @returns {Promise<Object>} - Tokens { access_token, id_token, refresh_token, expires_in }
 */
export async function handleOAuthCallback(code, state, tokenEndpoint, clientId) {
  try {
    // Validate state parameter
    const storedState = sessionStorage.getItem(OIDC_STORAGE_KEYS.STATE);
    if (state !== storedState) {
      throw new Error('State parameter mismatch - possible CSRF attack!');
    }

    // Check request time (avoid replay attacks)
    const requestTime = parseInt(sessionStorage.getItem(OIDC_STORAGE_KEYS.REQUEST_TIME));
    const elapsed = Date.now() - requestTime;
    if (elapsed > 10 * 60 * 1000) {
      // 10 minutes timeout
      throw new Error('Authorization request expired');
    }

    // Get code verifier for PKCE
    const codeVerifier = sessionStorage.getItem(OIDC_STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      throw new Error('Code verifier not found - session may have expired');
    }

    // Exchange code for tokens
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        code_verifier: codeVerifier,
      }).toString(),
      credentials: 'include', // Include cookies for CSRF
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error_description || `Token exchange failed: ${response.status}`);
    }

    const tokens = await response.json();

    // Clear OIDC session data
    sessionStorage.removeItem(OIDC_STORAGE_KEYS.STATE);
    sessionStorage.removeItem(OIDC_STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(OIDC_STORAGE_KEYS.NONCE);
    sessionStorage.removeItem(OIDC_STORAGE_KEYS.REQUEST_TIME);

    console.log('✅ Token exchange successful');
    return tokens;
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    throw error;
  }
}

/**
 * Get stored OIDC state (for debugging/validation)
 * @returns {Object} - Current OIDC state
 */
export function getOIDCState() {
  return {
    state: sessionStorage.getItem(OIDC_STORAGE_KEYS.STATE),
    hasCodeVerifier: !!sessionStorage.getItem(OIDC_STORAGE_KEYS.CODE_VERIFIER),
    hasNonce: !!sessionStorage.getItem(OIDC_STORAGE_KEYS.NONCE),
    requestAge: Date.now() - parseInt(sessionStorage.getItem(OIDC_STORAGE_KEYS.REQUEST_TIME) || 0),
  };
}

/**
 * Clear all OIDC session data (for logout)
 */
export function clearOIDCState() {
  sessionStorage.removeItem(OIDC_STORAGE_KEYS.STATE);
  sessionStorage.removeItem(OIDC_STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(OIDC_STORAGE_KEYS.NONCE);
  sessionStorage.removeItem(OIDC_STORAGE_KEYS.REQUEST_TIME);
}
