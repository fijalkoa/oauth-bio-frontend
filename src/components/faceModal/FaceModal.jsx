import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import "./FaceModal.css";
import VideoFeed from "./VideoFeed";
import { useFaceDetection } from "./useFaceDetection";
import { useFaceRegistration } from "./useFaceRegistration";

export default function FaceModal({
  title = "Verify Your Identity",
  wsUrl = "ws://localhost:8080/ws/face",
  onClose,
  altAction,
  altActionLabel = "Authenticate with password",
  mode = "login",
}) {
  const imageRef = useRef(null); // now we use an image instead of video

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const [subtitle, setSubtitle] = useState("Position your face in the circle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(null);
  const [stopped, setStopped] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const navigate = useNavigate();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      console.log("Face API models loaded");
      setModelsLoaded(true);   // <-- dopiero teraz!!!
    };

    loadModels();
  }, []);


  // Close modal and cleanup
  const handleClose = useCallback(() => {
    setStopped(true); // stop hooks loops

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    onClose?.();
  }, [onClose]);

  // Initialize WebSocket and send meta info
  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.binaryType = "arraybuffer";

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");

      // Send mode info immediately
      wsRef.current.send(JSON.stringify({
        type: "meta",
        mode: mode,
        step: "0"
      }));
    };

    wsRef.current.onmessage = (msg) => {
      const data = msg.data;
      console.log("Server response:", data);

      if (mode === "login") {
        if (data === "false") {
          setIsCapturing(false);
          setSubtitle("Face not recognized, please try again");
        } else if (data === "true") {
          handleClose();
          setSubtitle("Face accepted!");
          alert("Logged in successfully!");
          navigate("/home");
        }
      } else if (mode === "register") {
        if (data.startsWith("MOVE_HEAD:")) {
          const move = data.split(":")[1];
          setRegistrationStep(move);

          setSubtitle(`Please move your head ${move}`);

          // Send current step to server
          wsRef.current.send(JSON.stringify({
            type: "meta",
            mode: "register",
            step: move
          }));
        } else if (data === "ENROLLMENT_OK") {
          handleClose();
          alert("Registration complete!");
          navigate("/home");
        }
      }
    };

    wsRef.current.onclose = () => console.log("WebSocket closed");

    return () => wsRef.current?.close();
  }, [wsUrl, mode, navigate, handleClose]);

  // Hooks for face detection and registration
  useFaceDetection(videoRef, wsRef, isCapturing, setIsCapturing, setSubtitle, stopped);
  useFaceRegistration(videoRef, wsRef, registrationStep, setSubtitle, setIsCapturing, stopped, modelsLoaded);

  return (
    <div className="face-modal-overlay">
      <div className="face-login-container">
        {onClose && <button className="close-btn" onClick={handleClose}>×</button>}
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {/* <VideoFeed ref={videoRef} /> */}
        {/* Display a static image instead of video */}
        <div className="face-circle">
          <img
            ref={imageRef}
            src="/images/user.png"
            alt="User placeholder"
            className="face-image-small"
          />
        </div>
        {altAction && <button className="alt-auth" onClick={altAction}>{altActionLabel}</button>}
      </div>
    </div>
  );
}
