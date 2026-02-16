/**
 * CSRF (Cross-Site Request Forgery) Token Service
 * Generates and manages CSRF tokens for API requests
 */

const CSRF_STORAGE_KEY = "biosso_csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * Generate a random CSRF token
 * @returns {string} - Random CSRF token
 */
function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get or create CSRF token
 * Token is stored in sessionStorage and persists for the session
 * @returns {string} - CSRF token
 */
export function getCSRFToken() {
  let token = sessionStorage.getItem(CSRF_STORAGE_KEY);

  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    console.log("✅ Generated new CSRF token");
  }

  return token;
}

/**
 * Get CSRF token headers for API requests
 * @returns {Object} - Headers object with CSRF token
 */
export function getCSRFHeaders() {
  return {
    [CSRF_HEADER_NAME]: getCSRFToken(),
  };
}

/**
 * Clear CSRF token (for logout)
 */
export function clearCSRFToken() {
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
  console.log("✅ CSRF token cleared");
}

/**
 * Validate CSRF token in response headers
 * @param {Response} response - Fetch response object
 * @returns {boolean} - True if valid or no token in response
 */
export function validateCSRFToken(response) {
  const responseToken = response.headers.get(CSRF_HEADER_NAME);
  if (!responseToken) {
    // Backend didn't send token back (optional)
    return true;
  }

  const localToken = getCSRFToken();
  const isValid = responseToken === localToken;

  if (!isValid) {
    console.warn("⚠️ CSRF token mismatch!");
  }

  return isValid;
}
