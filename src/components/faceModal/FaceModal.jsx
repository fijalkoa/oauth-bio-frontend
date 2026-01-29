import React, { useEffect, useRef, useState, useCallback, use } from "react";
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
  userId = "unknown",
  registrationData = null,
}) {
  console.log("[FaceModal] Component loaded with userId:", userId);
  console.log("[FaceModal] Registration data:", registrationData);
  
  const imageRef = useRef(null); // now we use an image instead of video

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const [subtitle, setSubtitle] = useState("Position your face in the circle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(null);
  const [stopped, setStopped] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [wsReady, setWsReady] = useState(false);

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
      console.log("WebSocket connected, sending meta with userId:", userId);
      setWsReady(true);

      // Send mode info immediately
      const metaMessage = {
        type: "meta",
        mode: mode,
        step: "0",
        userId: userId
      };

      // If registering, include user data
      if (mode === "register" && registrationData) {
        metaMessage.registrationData = registrationData;
        console.log("Sending registration data:", registrationData);
      }

      wsRef.current.send(JSON.stringify(metaMessage));
    };

    wsRef.current.onmessage = (msg) => {
      const data = msg.data;
      console.log("Server response:", data);

      if (mode === "login") {
        if (data === "false") {
          setIsCapturing(false);
          setSubtitle("Face not recognized, please try again");
          // Automatically prepare for retry
          setTimeout(() => {
            setIsCapturing(true);
            setSubtitle("Position your face in the circle");
          }, 2000);
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
            step: move,
            userId: userId
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
  useFaceDetection(videoRef, wsRef, isCapturing, setIsCapturing, setSubtitle, stopped, wsReady);
  useFaceRegistration(videoRef, wsRef, registrationStep, setSubtitle, setIsCapturing, stopped, modelsLoaded, wsReady);

  return (
    <div className="face-modal-overlay">
      <div className="face-login-container">
        {onClose && <button className="close-btn" onClick={handleClose}>×</button>}
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        <VideoFeed ref={videoRef} />
        <div className="face-circle"></div>
        {altAction && <button className="alt-auth" onClick={altAction}>{altActionLabel}</button>}
      </div>
    </div>
  );
}
