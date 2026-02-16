import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import "./FaceModal.css";
import VideoFeed from "./VideoFeed";
import { useFaceCapture } from "./useFaceCapture";
import { useRegistrationCapture } from "./useRegistrationCapture";
import { registerBiometric, verifyForAuthentication } from "../../services/biometricService";
import { storeTokens } from "../../services/authService";

export default function FaceModal({
  title = "Verify Your Identity",
  onClose,
  altAction,
  altActionLabel = "Authenticate with password",
  mode = "login",
  userId = "unknown",
  registrationData = null,
}) {
  const videoRef = useRef(null);
  const [subtitle, setSubtitle] = useState("Position your face in the circle");
  const [stopped, setStopped] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const navigate = useNavigate();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("✅ Face API models loaded");
        setModelsLoaded(true);
      } catch (err) {
        console.error("❌ Failed to load models:", err);
        setError("Failed to load face detection models. Please refresh the page.");
      }
    };

    loadModels();
  }, []);

  // Close modal and cleanup
  const handleClose = useCallback(() => {
    setStopped(true);

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }

    onClose?.();
  }, [onClose]);

  // Handle single image capture (login mode)
  const handleImageCaptured = useCallback(
    (blob) => {
      if (mode === "login") {
        setCapturedImage(blob);
        setSubtitle("Face captured! Verifying...");
        verifyFaceForLogin(blob);
      }
    },
    [mode]
  );

  // Verify face during login
  const verifyFaceForLogin = async (imageBlob) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyForAuthentication(userId, imageBlob, 0.5);

      if (result.status === "success") {
        // Store tokens if provided
        if (result.access_token && result.id_token) {
          storeTokens(
            result.access_token,
            result.id_token,
            result.refresh_token || null,
            result.expires_in || 3600,
            {
              email: userId,
              name: result.user_name,
            }
          );
        }

        setSubtitle("✅ Face verified! Redirecting...");
        handleClose();

        // Small delay before navigation
        setTimeout(() => {
          if (result.redirect_url) {
            window.location.href = result.redirect_url;
          } else {
            navigate("/home");
          }
        }, 1000);
      } else {
        setError(result.message || "Face verification failed");
        setSubtitle("❌ Face not recognized. Try again.");
        setCapturedImage(null);

        // Auto-retry after delay
        setTimeout(() => {
          setSubtitle("Position your face in the circle");
          setCapturedImage(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "Verification failed. Please try again.");
      setSubtitle("❌ " + err.message);
      setCapturedImage(null);

      setTimeout(() => {
        setSubtitle("Position your face in the circle");
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration - all 5 images collected
  const handleImagesCollected = useCallback(
    async (images) => {
      setIsLoading(true);
      setError(null);
      setSubtitle("📤 Uploading biometric data...");

      try {
        const result = await registerBiometric(userId, images, true);

        if (result.status === "success" || result.enrollment_id) {
          setSubtitle("✅ Registration complete!");
          handleClose();

          // Store success in session for Signup component
          sessionStorage.setItem("biometric_registered", JSON.stringify(result));

          setTimeout(() => {
            navigate("/home");
          }, 1000);
        } else {
          throw new Error(result.message || "Registration failed");
        }
      } catch (err) {
        console.error("Registration error:", err);
        setError(err.message);
        setSubtitle("❌ Registration failed: " + err.message);

        setTimeout(() => {
          setSubtitle("Please try again");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, navigate, handleClose]
  );

  // Use appropriate hook based on mode
  const isReady = modelsLoaded && !stopped;
  useFaceCapture(videoRef, mode, mode === "login" ? handleImageCaptured : null, setSubtitle, stopped, isReady);
  useRegistrationCapture(
    videoRef,
    mode === "register" ? handleImagesCollected : null,
    setSubtitle,
    stopped,
    modelsLoaded,
    isReady
  );

  return (
    <div className="face-modal-overlay">
      <div className="face-login-container">
        {onClose && (
          <button className="close-btn" onClick={handleClose} disabled={isLoading}>
            ×
          </button>
        )}
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>

        {error && <div className="error-message">⚠️ {error}</div>}
        {cameraError && <div className="error-message">📹 {cameraError}</div>}

        <VideoFeed
          ref={videoRef}
          onError={(err) => {
            setCameraError(err.message);
            setSubtitle("❌ " + err.message);
          }}
          onSuccess={() => {
            setCameraError(null);
            setSubtitle("Camera ready - Position your face in the circle");
          }}
        />
        <div className="face-circle"></div>

        {isLoading && <div className="loading-spinner">Processing...</div>}

        {altAction && (
          <button className="alt-auth" onClick={altAction} disabled={isLoading}>
            {altActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
