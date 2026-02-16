/**
 * Biometric API Service
 * Handles all communication with backend biometric endpoints
 */

import { getCSRFHeaders } from "./csrfService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
const BIOMETRIC_ENDPOINT = `${API_BASE_URL}/biometric`;

/**
 * Register user with 5 face images (front, left, right, up, down)
 * @param {string} userId - User email or ID
 * @param {Object} images - { front, left, right, up, down } - File objects from canvas
 * @param {boolean} checkLiveness - Whether to check for liveness (default: true)
 * @returns {Promise<Object>} - Response with enrollment_id, template_hash, status
 */
export async function registerBiometric(userId, images, checkLiveness = true) {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("image_front", images.front, "front.png");
  formData.append("image_left", images.left, "left.png");
  formData.append("image_right", images.right, "right.png");
  formData.append("image_up", images.up, "up.png");
  formData.append("image_down", images.down, "down.png");
  formData.append("check_liveness", checkLiveness);

  try {
    const response = await fetch(`${BIOMETRIC_ENDPOINT}/register`, {
      method: "POST",
      headers: {
        ...getCSRFHeaders(), // Add CSRF token
      },
      body: formData,
      credentials: "include", // Include cookies for CSRF protection
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Registration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Biometric registration error:", error);
    throw error;
  }
}

/**
 * Verify user with single face image during authentication
 * Called after password login to complete biometric verification
 * @param {string} userEmail - User email
 * @param {Blob} image - Canvas blob of face image
 * @param {number} threshold - Confidence threshold (0.0-1.0, default: 0.5)
 * @returns {Promise<Object>} - { status, message, user_email, confidence, redirect_url }
 */
export async function verifyForAuthentication(userEmail, image, threshold = 0.5) {
  const formData = new FormData();
  formData.append("user_email", userEmail);
  formData.append("image", image, "face.png");
  formData.append("threshold", threshold);

  try {
    const response = await fetch(`${BIOMETRIC_ENDPOINT}/verify-for-auth`, {
      method: "POST",
      headers: {
        ...getCSRFHeaders(), // Add CSRF token
      },
      body: formData,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Verification failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Biometric verification error:", error);
    throw error;
  }
}

/**
 * Standalone biometric verification (not tied to login)
 * @param {string} userId - User email or ID
 * @param {Blob} image - Face image
 * @param {number} threshold - Confidence threshold
 * @returns {Promise<Object>} - { is_matched, confidence, verification_time_ms }
 */
export async function verifyBiometric(userId, image, threshold = 0.5) {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("image", image, "face.png");
  formData.append("threshold", threshold);

  try {
    const response = await fetch(`${BIOMETRIC_ENDPOINT}/verify`, {
      method: "POST",
      headers: {
        ...getCSRFHeaders(), // Add CSRF token
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Verification failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Biometric verification error:", error);
    throw error;
  }
}

/**
 * Health check - verify biometric service is operational
 * @returns {Promise<Object>} - Service health status
 */
export async function checkBiometricHealth() {
  try {
    const response = await fetch(`${BIOMETRIC_ENDPOINT}/health`);
    return await response.json();
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
}

/**
 * Get biometric service metrics
 * @returns {Promise<Object>} - Performance metrics
 */
export async function getBiometricMetrics() {
  try {
    const response = await fetch(`${BIOMETRIC_ENDPOINT}/metrics`);
    return await response.json();
  } catch (error) {
    console.error("Metrics fetch failed:", error);
    throw error;
  }
}
