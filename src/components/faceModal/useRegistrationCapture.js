/**
 * Hook for capturing 5 images during biometric registration
 * Detects head movements and captures images when user moves head correctly
 */
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { estimateHeadMovementRelative } from "./estimateHeadMovementRelative";

const POSE_SEQUENCE = ["front", "left", "right", "up", "down"];

export function useRegistrationCapture(
  videoRef,
  onImagesCollected,
  setSubtitle,
  stopped,
  modelsLoaded,
  isReady
) {
  const neutralRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState({});
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseDetectedCount, setPoseDetectedCount] = useState(0);

  useEffect(() => {
    if (!modelsLoaded || stopped || !isReady) return;
    if (!videoRef.current) return;

    let intervalId;
    const FRAMES_NEEDED = 5; // Need 5 frames of correct pose before capturing

    const detectAndCapture = async () => {
      if (!videoRef.current || stopped) return;

      // Ensure video is ready
      if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        // Detect all faces to ensure only one person
        const allDetections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (allDetections.length !== 1) {
          if (allDetections.length > 1) {
            setSubtitle?.("⚠️ Multiple faces detected - please ensure only one face is visible");
          } else {
            setSubtitle?.("Position your face in the circle");
          }
          setPoseDetectedCount(0);
          return;
        }

        // Get face landmarks
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(faceapi.nets.faceLandmark68TinyNet);

        if (!detection) return;

        // Set neutral position on first detection
        if (!neutralRef.current) {
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const nose = detection.landmarks.getNose();
          const jaw = detection.landmarks.getJawOutline();

          const eyeCenterX =
            (leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length +
              rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length) /
            2;
          const eyeCenterY =
            (leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length +
              rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length) /
            2;
          const noseX = nose[3].x;
          const noseY = nose[3].y;
          const chinY = jaw[8].y;

          neutralRef.current = { eyeCenterX, eyeCenterY, noseX, noseY, chinY };
          setSubtitle?.(`📸 Move your head ${POSE_SEQUENCE[0]}`);
          return;
        }

        // Detect head movement
        const detectedPose = estimateHeadMovementRelative(detection, neutralRef.current);
        const expectedPose = POSE_SEQUENCE[currentPoseIndex];

        // Wrong pose
        if (detectedPose !== expectedPose) {
          setPoseDetectedCount(0);
          if (detectedPose !== "front") {
            setSubtitle?.(`📸 Move your head ${expectedPose}`);
          } else {
            setSubtitle?.("🔄 Reset to neutral, then move");
          }
          return;
        }

        // Correct pose detected, increment counter
        const newCount = poseDetectedCount + 1;
        setPoseDetectedCount(newCount);
        setSubtitle?.(`✅ Holding ${expectedPose}... (${newCount}/${FRAMES_NEEDED})`);

        // After N frames in correct pose, capture
        if (newCount >= FRAMES_NEEDED) {
          const box = detection.detection.box;
          const canvas = document.createElement("canvas");
          canvas.width = box.width;
          canvas.height = box.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            videoRef.current,
            box.x,
            box.y,
            box.width,
            box.height,
            0,
            0,
            box.width,
            box.height
          );

          canvas.toBlob((blob) => {
            if (!blob) return;

            const newImages = {
              ...capturedImages,
              [expectedPose]: blob,
            };
            setCapturedImages(newImages);

            // Check if all poses are captured
            if (Object.keys(newImages).length === POSE_SEQUENCE.length) {
              setSubtitle?.("✅ All poses captured! Processing...");
              if (onImagesCollected) {
                onImagesCollected(newImages);
              }
            } else {
              // Move to next pose
              const nextIndex = currentPoseIndex + 1;
              setCurrentPoseIndex(nextIndex);
              setPoseDetectedCount(0);
              setSubtitle?.(`📸 Now move your head ${POSE_SEQUENCE[nextIndex]}`);
            }
          }, "image/png");
        }
      } catch (err) {
        console.warn("Detection error:", err);
      }
    };

    intervalId = setInterval(detectAndCapture, 200);

    return () => clearInterval(intervalId);
  }, [
    videoRef,
    currentPoseIndex,
    poseDetectedCount,
    capturedImages,
    onImagesCollected,
    setSubtitle,
    stopped,
    modelsLoaded,
    isReady,
  ]);

  return { capturedImages, currentPoseIndex, poseDetectedCount };
}
