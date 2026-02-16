/**
 * Hook for auto-refresh token management
 * Refreshes token before expiry
 */
import { useEffect } from "react";
import {
  shouldRefreshToken,
  refreshAccessToken,
  getTimeUntilExpiry,
  clearTokens,
} from "../services/authService";

// Global timeout ID for cleanup
let refreshTimeoutId = null;

/**
 * Setup auto-refresh for token
 * Schedules token refresh before expiry
 */
export function setupAutoRefresh() {
  const scheduleRefresh = () => {
    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    const timeUntilExpiry = getTimeUntilExpiry();
    if (timeUntilExpiry <= 0) {
      // Token already expired
      clearTokens();
      console.log("⏰ Token expired, cleared storage");
      return;
    }

    // Refresh 1 minute before expiry (safer than 5 minutes)
    const REFRESH_BEFORE = 1 * 60 * 1000; // 1 minute
    const refreshTime = timeUntilExpiry - REFRESH_BEFORE;

    if (refreshTime > 0) {
      refreshTimeoutId = setTimeout(async () => {
        try {
          console.log("🔄 Auto-refreshing token...");
          await refreshAccessToken();
          scheduleRefresh(); // Schedule next refresh
        } catch (err) {
          console.error("❌ Auto-refresh failed:", err);
          clearTokens();
          // Redirect to login
          window.location.href = "/login";
        }
      }, refreshTime);

      console.log(`⏱️ Token refresh scheduled in ${Math.round(refreshTime / 1000)}s`);
    } else if (shouldRefreshToken()) {
      // Token needs immediate refresh
      refreshAccessToken()
        .then(() => scheduleRefresh())
        .catch(() => {
          clearTokens();
          window.location.href = "/login";
        });
    }
  };

  scheduleRefresh();

  // Return cleanup function
  return () => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }
  };
}

/**
 * React Hook for auto-refresh
 * Use in main App component
 */
export function useAutoRefresh() {
  useEffect(() => {
    const cleanup = setupAutoRefresh();
    return cleanup;
  }, []);
}
