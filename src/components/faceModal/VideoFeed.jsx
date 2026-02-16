import React, { forwardRef, useEffect } from "react";

const VideoFeed = forwardRef(({ onError, onSuccess }, ref) => {
  useEffect(() => {
    let stream = null;

    const initCamera = async () => {
      try {
        // Request camera access with specific constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false, // We don't need audio
        });

        if (ref.current) {
          ref.current.srcObject = stream;
          
          // Wait for video to be ready
          ref.current.onloadedmetadata = () => {
            ref.current
              .play()
              .then(() => {
                console.log("✅ Camera started successfully");
                onSuccess?.();
              })
              .catch((err) => {
                console.error("❌ Play error:", err);
                onError?.(err);
              });
          };
        }
      } catch (err) {
        console.error("❌ Camera access error:", err);

        let errorMessage = "Error accessing camera";

        if (err.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (err.name === "NotFoundError") {
          errorMessage =
            "No camera found. Please check your device has a working camera.";
        } else if (err.name === "NotReadableError") {
          errorMessage =
            "Camera is in use by another application. Please close other apps using the camera.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage =
            "Your camera does not meet the required specifications. Please try another camera device.";
        } else if (err.name === "SecurityError") {
          errorMessage =
            "Camera access requires HTTPS. Please use a secure connection.";
        }

        onError?.(new Error(errorMessage));
      }
    };

    initCamera();

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("✅ Camera track stopped");
        });
      }
      if (ref.current?.srcObject) {
        const tracks = ref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [ref, onError, onSuccess]);

  return <video ref={ref} className="face-video" />;
});

VideoFeed.displayName = "VideoFeed";

export default VideoFeed;
