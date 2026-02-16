/**
 * Hook for capturing images from video feed
 * Focuses on single image capture for login/standalone verification
 */
import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export function useFaceCapture(videoRef, mode = "single", onImageCaptured, setSubtitle, stopped, isReady) {
  const [capturedImages, setCapturedImages] = useState({});

  useEffect(() => {
    if (stopped || !isReady) return;

    let intervalId;
    let captureTimeout = null;

    const detectAndCapture = async () => {
      if (!videoRef.current || stopped) return;

      // Ensure video is loaded and ready
      if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        // Check number of faces
        if (detections.length === 0) {
          setSubtitle?.("Position your face in the circle");
          return;
        } else if (detections.length > 1) {
          setSubtitle?.("⚠️ Multiple faces detected - please ensure only one face is visible");
          return;
        }

        // Single face detected
        if (detections.length === 1) {
          const box = detections[0].box;
          
          // Capture image from video
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

          // Convert to Blob
          canvas.toBlob((blob) => {
            if (blob && onImageCaptured) {
              onImageCaptured(blob);
              setSubtitle?.("✅ Face captured!");
              
              // Clear timeout if exists
              if (captureTimeout) clearTimeout(captureTimeout);
            }
          }, "image/png");
        }
      } catch (err) {
        console.warn("Face detection error:", err);
      }
    };

    intervalId = setInterval(detectAndCapture, 300);

    return () => {
      clearInterval(intervalId);
      if (captureTimeout) clearTimeout(captureTimeout);
    };
  }, [videoRef, stopped, isReady, onImageCaptured, setSubtitle]);

  return { capturedImages, setCapturedImages };
}
