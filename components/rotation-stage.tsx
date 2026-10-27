"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { plateSize, usePlate } from "@/components/use-plate";
import { TESSERACT_EDGES, TESSERACT_FACES } from "@/lib/hypercube";
import { usePrefersReducedMotion } from "@/lib/motion";
import { depthTone, prepare, stroke } from "@/lib/paint";
import { projectTesseract } from "@/lib/project";

export function RotationStage() {
  const reduce = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const timeRef = useRef(0.35);
  const drag = useRef({
    active: false,
    x: 0,
    y: 0,
    yaw: 0.52,
    pitch: 0.34,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height, dpr } = plateSize(canvas);
    prepare(ctx, width, height, dpr);

    const theta = timeRef.current * 0.42;
    const yaw = drag.current.yaw + timeRef.current * 0.11;
    const pitch = drag.current.pitch;
    const points = projectTesseract(theta, yaw, pitch);
    const scale = Math.min(width, height) * 0.2;
    const toScreen = (index: number) => ({
      x: width / 2 + points[index].x * scale,
      y: height / 2 - points[index].y * scale,
      z: points[index].z,
      w: points[index].w,
    });

    const faces = TESSERACT_FACES.map((face) => {
      const pts = face.map(toScreen);
      const z = pts.reduce((sum, p) => sum + p.z, 0) / pts.length;
      const w = pts.reduce((sum, p) => sum + p.w, 0) / pts.length;
      return { pts, z, w };
    }).sort((a, b) => b.z - a.z);

    for (const face of faces) {
      ctx.beginPath();
      face.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = depthTone(face.w).face;
      ctx.fill();
    }

    const edges = TESSERACT_EDGES.map(([a, b]) => {
      const pa = toScreen(a);
      const pb = toScreen(b);
      return { pa, pb, z: (pa.z + pb.z) / 2, w: (pa.w + pb.w) / 2 };
    }).sort((a, b) => b.z - a.z);

    for (const edge of edges) {
      const tone = depthTone(edge.w);
      stroke(ctx, edge.pa.x, edge.pa.y, edge.pb.x, edge.pb.y, tone.edge, tone.width, tone.alpha);
    }
  }, []);

  usePlate(canvasRef, draw);

  useEffect(() => {
    playingRef.current = playing && !reduce;
  }, [playing, reduce]);

  useEffect(() => {
    if (!reduce) setPlaying(true);
  }, [reduce]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playingRef.current) timeRef.current += dt;
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current.active = true;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    drag.current.yaw += dx * 0.0055;
    drag.current.pitch = Math.min(1.05, Math.max(-0.2, drag.current.pitch + dy * 0.005));
  };

  const onPointerUp = () => {
    drag.current.active = false;
  };

  return (
    <figure className="mx-auto mt-12 w-full max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#100e0c] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-[16/10] w-full">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
            role="img"
            aria-label="Вращающийся четырёхмерный куб в центральной проекции. Ближняя ячейка крупнее дальней, поэтому один куб кажется вложенным в другой."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>
      <figcaption className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="font-body text-[0.72rem] uppercase tracking-[0.22em] text-[#e6b15a]">
            Центральная проекция
          </p>
          <p className="mt-1 text-[0.98rem] leading-relaxed text-[#cbbba6]">
            Тёплое ребро ближе к точке наблюдения, тусклое — дальше. Фигуру можно повернуть.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={playing && !reduce}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing && !reduce ? "Пауза" : "Запустить"}
        </Button>
      </figcaption>
    </figure>
  );
}
