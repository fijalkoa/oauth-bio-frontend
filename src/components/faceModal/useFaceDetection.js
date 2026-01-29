import { useEffect } from "react";
import * as faceapi from "face-api.js";

export function useFaceDetection(videoRef, wsRef, isCapturing, setIsCapturing, setSubtitle, stopped, wsReady) {
  useEffect(() => {
    if (stopped || !wsReady) return;

    let intervalId;

    const detectFace = async () => {
      if (!videoRef.current || isCapturing || stopped) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 0) {
        setSubtitle("Face captured, analyzing...");
        setIsCapturing(true);
        return detections[0].box;
      }
    };

    intervalId = setInterval(async () => {
      const box = await detectFace();
      if (box && wsRef.current?.readyState === WebSocket.OPEN) {
        captureAndSendFace(box);
      }
    }, 200);

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

        let header = 1;
        if (offset === 0) header = 0;
        if (end === byteArray.length) header = 2;

        const chunkWithHeader = new Uint8Array(chunk.length + 1);
        chunkWithHeader[0] = header;
        chunkWithHeader.set(chunk, 1);

        wsRef.current?.send(chunkWithHeader.buffer);
        offset = end;
      }
    };

    return () => clearInterval(intervalId);
  }, [videoRef, wsRef, isCapturing, setIsCapturing, setSubtitle, stopped, wsReady]);
}
