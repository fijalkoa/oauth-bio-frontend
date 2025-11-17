import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { estimateHeadMovementRelative } from "./estimateHeadMovementRelative";

export function useFaceRegistration(
  videoRef,
  wsRef,
  registrationStep,
  setSubtitle,
  setIsCapturing,
  stopped,
  modelsLoaded
) {
  const neutralRef = useRef(null); // <- wywołany zawsze

  useEffect(() => {
    if (!modelsLoaded) return; // <- warunek wewnątrz useEffect
    if (!videoRef.current || !wsRef.current) return;
    if (!registrationStep || stopped) return;

    const captureAndSendFace = (box) => {
      const canvas = document.createElement("canvas");
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const buffer = await blob.arrayBuffer();
        sendInChunks(buffer);
      }, "image/png");
    };

    const sendInChunks = (buffer) => {
      const chunkSize = 6 * 1024;
      let offset = 0;
      const byteArray = new Uint8Array(buffer);

      while (offset < byteArray.length) {
        const end = Math.min(offset + chunkSize, byteArray.length);
        const chunk = byteArray.slice(offset, end);

        let header = 1; // middle
        if (offset === 0) header = 0;
        if (end === byteArray.length) header = 2;

        const chunkWithHeader = new Uint8Array(chunk.length + 1);
        chunkWithHeader[0] = header;
        chunkWithHeader.set(chunk, 1);

        wsRef.current.send(chunkWithHeader.buffer);
        offset = end;
      }
    };

    const intervalId = setInterval(async () => {
      if (!videoRef.current || stopped) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(faceapi.nets.faceLandmark68TinyNet); // <--- TinyNet

        if (!detection) return;

        // ustawienie neutralnej pozycji przy pierwszej detekcji
        if (!neutralRef.current) {
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const nose = detection.landmarks.getNose();
          const jaw = detection.landmarks.getJawOutline();

          const eyeCenterX = (leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length +
            rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length) / 2;
          const eyeCenterY = (leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length +
            rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length) / 2;
          const noseX = nose[3].x;
          const noseY = nose[3].y;
          const chinY = jaw[8].y;

          neutralRef.current = { eyeCenterX, eyeCenterY, noseX, noseY, chinY };
          console.log("Neutral position set", neutralRef.current);
          return;
        }

        const moveDetected = estimateHeadMovementRelative(detection, neutralRef.current);

        if (moveDetected === registrationStep) {
          
          setIsCapturing(true);
          captureAndSendFace(detection.detection.box);
        }
      } catch (err) {
        console.warn("Face detection skipped, model not ready yet", err);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, [videoRef, wsRef, registrationStep, setIsCapturing, setSubtitle, stopped, modelsLoaded]);
}
