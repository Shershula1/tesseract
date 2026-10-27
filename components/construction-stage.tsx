"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { plateSize, usePlate } from "@/components/use-plate";
import { embedParallel } from "@/lib/hypercube";
import { lerp } from "@/lib/math";
import { usePrefersReducedMotion } from "@/lib/motion";
import { prepare, stroke } from "@/lib/paint";
import { buildFigure, storyAt, STORY_STEPS, type StoryFrame } from "@/lib/story";

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function boundsOf(dim: number): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const count = 1 << dim;
  for (let i = 0; i < count; i++) {
    const p = [0, 0, 0, 0];
    for (let axis = 0; axis < dim; axis++) p[axis] = (i >> axis) & 1;
    const point = embedParallel(p);
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const width = Math.max(1.45, (maxX - minX) * 1.34);
  const height = Math.max(1.2, (maxY - minY) * 1.34);
  return { minX: cx - width / 2, maxX: cx + width / 2, minY: cy - height / 2, maxY: cy + height / 2 };
}

const BOUNDS = [boundsOf(1), boundsOf(2), boundsOf(3), boundsOf(4)];

function mixBounds(a: Bounds, b: Bounds, t: number): Bounds {
  return {
    minX: lerp(a.minX, b.minX, t),
    minY: lerp(a.minY, b.minY, t),
    maxX: lerp(a.maxX, b.maxX, t),
    maxY: lerp(a.maxY, b.maxY, t),
  };
}

export function ConstructionStage() {
  const reduce = usePrefersReducedMotion();
  const [manual, setManual] = useState<boolean | null>(null);
  const playing = manual ?? !reduce;
  const playingRef = useRef(playing);
  const timeRef = useRef(0);
  const [frame, setFrame] = useState<Pick<StoryFrame, "caption" | "step">>({
    caption: "Отрезок",
    step: 0,
  });
  const frameRef = useRef(frame);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height, dpr } = plateSize(canvas);
    const story = storyAt(timeRef.current);
    if (story.caption !== frameRef.current.caption || story.step !== frameRef.current.step) {
      frameRef.current = { caption: story.caption, step: story.step };
      setFrame(frameRef.current);
    }

    prepare(ctx, width, height, dpr);
    ctx.save();
    ctx.globalAlpha = story.fade;

    const previous = BOUNDS[Math.max(0, story.dim - 2)];
    const current = BOUNDS[story.dim - 1];
    const view = mixBounds(previous, current, story.zoom);
    const spanX = view.maxX - view.minX;
    const spanY = view.maxY - view.minY;
    const scale = Math.min(width / spanX, height / spanY);
    const cx = (view.minX + view.maxX) / 2;
    const cy = (view.minY + view.maxY) / 2;
    const map = (p: number[]) => {
      const e = embedParallel(p);
      return {
        x: width / 2 + (e.x - cx) * scale,
        y: height / 2 - (e.y - cy) * scale,
      };
    };

    const edges = buildFigure(story.dim, story.move, story.join);
    const order = { old: 0, copy: 1, join: 2 };
    edges.sort((a, b) => order[a.kind] - order[b.kind]);

    for (const edge of edges) {
      const a = map(edge.a);
      const end = map(edge.b);
      const b = {
        x: a.x + (end.x - a.x) * edge.progress,
        y: a.y + (end.y - a.y) * edge.progress,
      };
      if (edge.kind === "join") {
        const gold = story.dim > 1;
        stroke(ctx, a.x, a.y, b.x, b.y, gold ? "#e6b15a" : "#f3eadf", gold ? 2.15 : 1.7, 0.98);
      } else if (edge.kind === "copy") {
        stroke(ctx, a.x, a.y, b.x, b.y, "#f7f1e6", 1.7, Math.min(1, story.move * 3));
      } else {
        stroke(ctx, a.x, a.y, b.x, b.y, "#f3eadf", 1.65, 0.82);
      }
    }

    ctx.restore();
  }, []);

  usePlate(canvasRef, draw);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!reduce) return;
    timeRef.current = 13.1;
    draw();
  }, [reduce, draw]);

  useEffect(() => {
    let handle = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playingRef.current) timeRef.current += dt;
      draw();
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, [draw]);

  const seek = (time: number) => {
    timeRef.current = time;
    draw();
  };

  return (
    <figure className="mx-auto mt-8 w-full max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#100e0c] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-[16/10] w-full">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Сборка четырёхмерного куба. Сейчас: ${frame.caption}.`}
          />
        </div>
      </div>
      <figcaption className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="font-body text-[0.72rem] uppercase tracking-[0.22em] text-[#e6b15a]">
              Параллельная проекция
            </p>
            <p className="mt-1 text-[0.98rem] leading-relaxed text-[#cbbba6]">{frame.caption}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={playing}
            onClick={() => setManual(!playing)}
          >
            {playing ? "Пауза" : "Запустить"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Шаги сборки">
          {STORY_STEPS.map((step, index) => (
            <Button
              key={step.label}
              type="button"
              size="sm"
              variant={frame.step === index ? "default" : "ghost"}
              aria-current={frame.step === index ? "step" : undefined}
              onClick={() => seek(step.time)}
            >
              {step.label}
            </Button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
