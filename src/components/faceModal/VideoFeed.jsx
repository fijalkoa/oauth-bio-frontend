import React, { forwardRef, useEffect } from "react";

const VideoFeed = forwardRef((props, ref) => {
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
          ref.current.play();
        }
      })
      .catch((err) => console.error("Error accessing camera:", err));

    return () => {
      if (ref.current?.srcObject) {
        const tracks = ref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [ref]);

  return <video ref={ref} className="face-video" />;
});

export default VideoFeed;
