export const prepareCanvas = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  contextAttributes: CanvasRenderingContext2DSettings = {},
) => {
  const dprCap = 1.5;
  const deviceRatio = window.devicePixelRatio || 1;
  const dpr = Math.min(deviceRatio, dprCap);
  const max = 16384;
  const safeW = Math.min(width, max);
  const safeH = Math.min(height, max);

  // Backing store sizes in device pixels
  const pxW = Math.round(safeW * dpr);
  const pxH = Math.round(safeH * dpr);

  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${safeW}px`;
    canvas.style.height = `${safeH}px`;
  }

  const ctx = canvas.getContext("2d", contextAttributes);
  if (!ctx) {
    throw new Error("Unable to acquire 2D canvas context");
  }
  // CRITICAL: draw/clear in CSS pixels by scaling the context to DPR
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
};

export const getColor = (variable: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
  return value ? value.trim() : fallback;
};
