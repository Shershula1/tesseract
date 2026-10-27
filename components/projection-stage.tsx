"use client";

import { useCallback, useEffect, useRef } from "react";

import { plateSize, usePlate } from "@/components/use-plate";
import { TESSERACT_EDGES, TESSERACT_FACES, TESSERACT_VERTICES } from "@/lib/hypercube";
import { usePrefersReducedMotion } from "@/lib/motion";
import { prepare, stroke } from "@/lib/paint";
import { projectTesseract } from "@/lib/project";
import { add, camProject, makeCamera, mul, rotX, rotY, sub, type V3 } from "@/lib/vec";

const LAMP: V3 = [1.85, 1.2, 2.45];
const PLANE_Z = -1.55;
const CAMERA = makeCamera([2.15, 1.7, 5.35], [0.05, 0.05, -0.15]);
const FOCAL = 4.5;

function cubeIndex(x: number, y: number, z: number) {
  return (x > 0 ? 1 : 0) | (y > 0 ? 2 : 0) | (z > 0 ? 4 : 0);
}

const CUBE_FACES: number[][] = [];
{
  const axes = [0, 1, 2] as const;
  for (let a = 0; a < 3; a++) {
    for (const sign of [-1, 1] as const) {
      const free = axes.filter((axis) => axis !== a);
      const cycle: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      CUBE_FACES.push(
        cycle.map(([u, v]) => {
          const signs = [0, 0, 0];
          signs[a] = sign;
          signs[free[0]] = u;
          signs[free[1]] = v;
          return cubeIndex(signs[0], signs[1], signs[2]);
        }),
      );
    }
  }
}

const CUBE_EDGES: [number, number][] = [];
for (let i = 0; i < 8; i++) {
  for (let j = i + 1; j < 8; j++) {
    const xi = i & 1 ? 1 : -1;
    const yi = i & 2 ? 1 : -1;
    const zi = i & 4 ? 1 : -1;
    const xj = j & 1 ? 1 : -1;
    const yj = j & 2 ? 1 : -1;
    const zj = j & 4 ? 1 : -1;
    const diff = Number(xi !== xj) + Number(yi !== yj) + Number(zi !== zj);
    if (diff === 1) CUBE_EDGES.push([i, j]);
  }
}

function cubeVertex(index: number): V3 {
  return [index & 1 ? 1 : -1, index & 2 ? 1 : -1, index & 4 ? 1 : -1];
}

function placeCube(vertex: V3, angle: number): V3 {
  const spun = rotX(rotY(vertex, angle + 0.55), 0.48);
  return [spun[0] * 0.58, spun[1] * 0.58, spun[2] * 0.58];
}

function hitPlane(origin: V3, through: V3): V3 | null {
  const dir = sub(through, origin);
  if (Math.abs(dir[2]) < 1e-5) return null;
  const t = (PLANE_Z - origin[2]) / dir[2];
  if (t <= 0) return null;
  return add(origin, mul(dir, t));
}

function shoelace(pts: { x: number; y: number }[]) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    area += pts[i].x * next.y - next.x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

export function ProjectionStage() {
  const reduce = usePrefersReducedMotion();
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const timeRef = useRef(0.4);
  const facePick = useRef(0);

  const cubeRef = useRef<HTMLCanvasElement>(null);
  const tesseractRef = useRef<HTMLCanvasElement>(null);

  const drawCube = useCallback(() => {
    const canvas = cubeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height, dpr } = plateSize(canvas);
    prepare(ctx, width, height, dpr);

    const angle = reduceRef.current ? 0.7 : timeRef.current * 0.28;
    const world = Array.from({ length: 8 }, (_, index) => placeCube(cubeVertex(index), angle));
    const shadows = world.map((vertex) => hitPlane(LAMP, vertex));
    const scale = Math.min(width, height) * 0.29;
    const screen = (p: V3) => {
      const q = camProject(CAMERA, p, FOCAL);
      return { x: width * 0.5 + q.x * scale, y: height * 0.52 - q.y * scale, z: q.z };
    };

    const sheet = [
      [-1.7, -1.25, PLANE_Z],
      [1.7, -1.25, PLANE_Z],
      [1.7, 1.25, PLANE_Z],
      [-1.7, 1.25, PLANE_Z],
    ].map((p) => screen(p as V3));

    ctx.beginPath();
    sheet.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = "rgba(243, 234, 223, 0.045)";
    ctx.fill();
    ctx.strokeStyle = "rgba(243, 234, 223, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const faceScreens = CUBE_FACES.map((face, index) => {
      const pts = face.map((vertex) => (shadows[vertex] ? screen(shadows[vertex]!) : null));
      if (pts.some((p) => !p)) return { index, pts: [], score: 0 };
      const ready = pts as { x: number; y: number; z: number }[];
      const area = shoelace(ready);
      const lengths = ready.map((p, i) => {
        const n = ready[(i + 1) % ready.length];
        return Math.hypot(n.x - p.x, n.y - p.y);
      });
      const ratio = Math.max(...lengths) / Math.max(8, Math.min(...lengths));
      const score = area > 280 ? ratio : 0;
      return { index, pts: ready, score, source: face };
    });

    let pick = facePick.current;
    const current = faceScreens[pick]?.score ?? 0;
    for (const face of faceScreens) {
      if (face.score > current * 1.12 && face.score > (faceScreens[pick]?.score ?? 0)) pick = face.index;
    }
    facePick.current = pick;
    const chosen = faceScreens[pick];

    for (let i = 0; i < 8; i++) {
      const shadow = shadows[i];
      if (!shadow) continue;
      const from = screen(LAMP);
      const to = screen(shadow);
      const hot = chosen?.source?.includes(i);
      stroke(ctx, from.x, from.y, to.x, to.y, hot ? "#f0c56a" : "#c9a36a", hot ? 1.35 : 0.9, hot ? 0.7 : 0.28);
    }

    if (chosen && chosen.pts.length === 4) {
      ctx.beginPath();
      chosen.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = "rgba(230, 177, 90, 0.38)";
      ctx.fill();
    }

    for (const [a, b] of CUBE_EDGES) {
      if (!shadows[a] || !shadows[b]) continue;
      const pa = screen(shadows[a]!);
      const pb = screen(shadows[b]!);
      const hot =
        chosen?.source?.includes(a) && chosen?.source?.includes(b);
      stroke(ctx, pa.x, pa.y, pb.x, pb.y, hot ? "#f2d48a" : "#f3eadf", hot ? 2 : 1.35, hot ? 1 : 0.78);
    }

    for (const [a, b] of CUBE_EDGES) {
      const pa = screen(world[a]);
      const pb = screen(world[b]);
      const hot = chosen?.source?.includes(a) && chosen?.source?.includes(b);
      stroke(ctx, pa.x, pa.y, pb.x, pb.y, hot ? "#f0c56a" : "#fff8ee", hot ? 2.2 : 1.55, 1);
    }

    const lamp = screen(LAMP);
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 28);
    glow.addColorStop(0, "rgba(255, 214, 120, 0.95)");
    glow.addColorStop(0.35, "rgba(230, 177, 90, 0.45)");
    glow.addColorStop(1, "rgba(230, 177, 90, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe3a3";
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "500 13px Georgia, serif";
    ctx.fillStyle = "#f0d7a4";
    ctx.fillText("точка", lamp.x + 12, lamp.y - 12);
  }, []);

  const drawTesseract = useCallback(() => {
    const canvas = tesseractRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height, dpr } = plateSize(canvas);
    prepare(ctx, width, height, dpr);

    const theta = reduceRef.current ? 0.42 : 0.28 + Math.sin(timeRef.current * 0.32) * 0.34;
    const yaw = 0.58 + Math.sin(timeRef.current * 0.18) * 0.06;
    const points = projectTesseract(theta, yaw, 0.36);
    const scale = Math.min(width, height) * 0.2;
    const screen = (index: number) => ({
      x: width / 2 + points[index].x * scale,
      y: height / 2 - points[index].y * scale,
      z: points[index].z,
    });

    const cellFaces = TESSERACT_FACES.filter((face) => face.every((index) => TESSERACT_VERTICES[index][1] === 1));
    const cell = new Set(cellFaces.flat());

    const faces = cellFaces
      .map((face) => {
        const pts = face.map(screen);
        const z = pts.reduce((sum, p) => sum + p.z, 0) / pts.length;
        return { pts, z };
      })
      .sort((a, b) => b.z - a.z);

    for (const face of faces) {
      ctx.beginPath();
      face.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = "rgba(230, 177, 90, 0.16)";
      ctx.fill();
    }

    const edges = TESSERACT_EDGES.map(([a, b]) => ({ a, b, z: (points[a].z + points[b].z) / 2 })).sort(
      (a, b) => b.z - a.z,
    );

    for (const edge of edges) {
      const hot = cell.has(edge.a) && cell.has(edge.b);
      const pa = screen(edge.a);
      const pb = screen(edge.b);
      stroke(ctx, pa.x, pa.y, pb.x, pb.y, hot ? "#f0c56a" : "#d9cbb8", hot ? 2.15 : 1.15, hot ? 1 : 0.38);
    }
  }, []);

  usePlate(cubeRef, drawCube);
  usePlate(tesseractRef, drawTesseract);

  useEffect(() => {
    let handle = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduceRef.current) timeRef.current += dt;
      drawCube();
      drawTesseract();
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, [drawCube, drawTesseract]);

  return (
    <div className="mx-auto mt-8 grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <figure>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#100e0c]">
          <div className="relative aspect-[5/4] w-full">
            <canvas
              ref={cubeRef}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label="Центральная проекция куба: лучи из жёлтой точки несут каркас на плоскость, и квадратная грань ложится трапецией."
            />
          </div>
        </div>
        <figcaption className="mt-3 text-[0.95rem] leading-relaxed text-[#cbbba6]">
          Луч из жёлтой точки через каждую вершину отмечает тень на плоскости. Подсвеченный квадрат стал трапецией.
        </figcaption>
      </figure>
      <figure>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#100e0c]">
          <div className="relative aspect-[5/4] w-full">
            <canvas
              ref={tesseractRef}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label="Центральная проекция тессеракта. Золотом выделена кубическая ячейка, которая на рисунке выглядит усечённой пирамидой."
            />
          </div>
        </div>
        <figcaption className="mt-3 text-[0.95rem] leading-relaxed text-[#cbbba6]">
          Та же проекция на измерение выше. Золотая ячейка — настоящий куб, а на рисунке усечённая четырёхугольная пирамида.
        </figcaption>
      </figure>
    </div>
  );
}
