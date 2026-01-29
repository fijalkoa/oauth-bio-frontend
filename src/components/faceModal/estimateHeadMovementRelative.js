/**
 * Estimate relative head movement based on face landmarks.
 * @param {faceapi.WithFaceLandmarks} detection
 * @param {Object} neutral - Neutral reference { noseX, noseY, eyeCenterX, eyeCenterY, chinY }
 * @returns {"UP"|"DOWN"|"LEFT"|"RIGHT"|null}
 */
export function estimateHeadMovementRelative(detection, neutral) {
  if (!detection?.landmarks || !neutral) return null;

  const average = (points, axis = "x") => {
    if (!points?.length) return 0;
    return points.reduce((sum, pt) => sum + (pt?.[axis] ?? pt?.[axis === "x" ? 0 : 1] ?? 0), 0) / points.length;
  };

  const nose = detection.landmarks.getNose();
  const noseTip = nose?.[3] || nose?.[0]; // match your hook's neutral

  const leftEye = detection.landmarks.getLeftEye();
  const rightEye = detection.landmarks.getRightEye();
  if (!leftEye?.length || !rightEye?.length) return null;

  const eyeCenterX = (average(leftEye, "x") + average(rightEye, "x")) / 2;
  const eyeCenterY = (average(leftEye, "y") + average(rightEye, "y")) / 2;

  const jaw = detection.landmarks.getJawOutline();
  const chinY = jaw?.[8]?.y ?? jaw?.[8]?.[1] ?? jaw?.[0]?.y ?? jaw?.[0]?.[1] ?? 0;

  // --- Deltas relative to neutral ---
  const deltaX = (noseTip.x ?? noseTip[0]) - eyeCenterX - (neutral.noseX - neutral.eyeCenterX);
  const deltaY = (noseTip.y ?? noseTip[1]) - eyeCenterY - (neutral.noseY - neutral.eyeCenterY);
  const deltaChin = chinY - neutral.chinY;

  const faceWidth = detection.detection?.box?.width || 1;
  const faceHeight = detection.detection?.box?.height || 1;

  const ratioX = deltaX / faceWidth;
  const ratioY = deltaY / faceHeight;
  const ratioChin = deltaChin / faceHeight;

  const threshold = 0.03;

  console.log(
    "ratios:",
    "X=", ratioX.toFixed(3),
    "Y=", ratioY.toFixed(3),
    "ChinY=", ratioChin.toFixed(3)
  );

  if (ratioX > threshold) return "LEFT";
  if (ratioX < -threshold) return "RIGHT";

  const vertical = (ratioY + ratioChin) / 2;
  if (vertical > threshold) return "DOWN";
  if (vertical < -threshold) return "UP";

  return null;
}
