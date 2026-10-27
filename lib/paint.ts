import { clamp, lerp } from "@/lib/math";

export function prepare(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.46,
    width * 0.05,
    width * 0.5,
    height * 0.5,
    width * 0.72,
  );
  glow.addColorStop(0, "#221c16");
  glow.addColorStop(0.55, "#14110e");
  glow.addColorStop(1, "#0c0b09");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

export function stroke(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
  alpha = 1,
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * 0.22;
  ctx.lineWidth = width * 3.6;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

export function depthTone(w: number) {
  const t = clamp((w + 1.42) / 2.84, 0, 1);
  return {
    t,
    edge: `rgb(${Math.round(lerp(142, 255, t))} ${Math.round(lerp(122, 228, t))} ${Math.round(lerp(98, 176, t))})`,
    face: `rgba(${Math.round(lerp(120, 244, t))}, ${Math.round(lerp(96, 196, t))}, ${Math.round(lerp(72, 140, t))}, ${lerp(0.03, 0.12, t).toFixed(3)})`,
    alpha: lerp(0.32, 1, t),
    width: lerp(1.05, 2.2, t),
  };
}
