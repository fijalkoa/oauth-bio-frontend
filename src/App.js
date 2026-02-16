import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PasswordLogin from "./PasswordLogin";
import Signup from "./Signup";
import HomePage from "./HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import OAuthCallback from "./components/OAuthCallback";
import { useAutoRefresh } from "./hooks/useAutoRefresh";

function App() {
  // Enable automatic token refresh before expiry
  useAutoRefresh();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PasswordLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
