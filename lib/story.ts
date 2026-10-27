import { clamp, smoothstep } from "@/lib/math";

export type StoryFrame = {
  dim: 1 | 2 | 3 | 4;
  move: number;
  join: number;
  caption: string;
  step: number;
  fade: number;
  /** 0 = previous figure fills the frame, 1 = the new figure does. */
  zoom: number;
};

type Segment = {
  t0: number;
  t1: number;
  dim: 1 | 2 | 3 | 4;
  move0: number;
  move1: number;
  join0: number;
  join1: number;
  caption: string;
  step: number;
  zoom0: number;
  zoom1: number;
};

const SEGMENTS: Segment[] = [
  { t0: 0, t1: 0.95, dim: 1, move0: 0, move1: 1, join0: 1, join1: 1, caption: "Отрезок", step: 0, zoom0: 1, zoom1: 1 },
  { t0: 0.95, t1: 1.55, dim: 1, move0: 1, move1: 1, join0: 1, join1: 1, caption: "Отрезок", step: 0, zoom0: 1, zoom1: 1 },
  { t0: 1.55, t1: 2.7, dim: 2, move0: 0, move1: 1, join0: 0, join1: 0, caption: "Копируем отрезок", step: 1, zoom0: 0, zoom1: 1 },
  { t0: 2.7, t1: 4.05, dim: 2, move0: 1, move1: 1, join0: 0, join1: 1, caption: "Соединяем соответственные вершины", step: 1, zoom0: 1, zoom1: 1 },
  { t0: 4.05, t1: 4.9, dim: 2, move0: 1, move1: 1, join0: 1, join1: 1, caption: "Квадрат", step: 1, zoom0: 1, zoom1: 1 },
  { t0: 4.9, t1: 6.15, dim: 3, move0: 0, move1: 1, join0: 0, join1: 0, caption: "Копируем квадрат", step: 2, zoom0: 0, zoom1: 1 },
  { t0: 6.15, t1: 7.7, dim: 3, move0: 1, move1: 1, join0: 0, join1: 1, caption: "Соединяем старые вершины с новыми", step: 2, zoom0: 1, zoom1: 1 },
  { t0: 7.7, t1: 8.55, dim: 3, move0: 1, move1: 1, join0: 1, join1: 1, caption: "Куб", step: 2, zoom0: 1, zoom1: 1 },
  { t0: 8.55, t1: 9.9, dim: 4, move0: 0, move1: 1, join0: 0, join1: 0, caption: "Копируем куб", step: 3, zoom0: 0, zoom1: 1 },
  { t0: 9.9, t1: 12.0, dim: 4, move0: 1, move1: 1, join0: 0, join1: 1, caption: "Соединяем восемь пар вершин", step: 3, zoom0: 1, zoom1: 1 },
  { t0: 12.0, t1: 14.4, dim: 4, move0: 1, move1: 1, join0: 1, join1: 1, caption: "Четырёхмерный куб — тессеракт", step: 3, zoom0: 1, zoom1: 1 },
];

export const STORY_DURATION = 14.4;

export const STORY_STEPS = [
  { label: "Отрезок", time: 1.15 },
  { label: "Квадрат", time: 4.4 },
  { label: "Куб", time: 8.05 },
  { label: "Тессеракт", time: 13.0 },
] as const;

export function storyAt(time: number): StoryFrame {
  const span = STORY_DURATION;
  let t = ((time % span) + span) % span;
  if (t >= span - 0.0001) t = 0;

  let segment = SEGMENTS[SEGMENTS.length - 1];
  for (const candidate of SEGMENTS) {
    if (t >= candidate.t0 && t < candidate.t1) {
      segment = candidate;
      break;
    }
  }

  const u = smoothstep((t - segment.t0) / (segment.t1 - segment.t0));
  let fade = 1;
  if (t < 0.35) fade = t / 0.35;
  if (t > span - 0.45) fade = (span - t) / 0.45;

  return {
    dim: segment.dim,
    move: segment.move0 + (segment.move1 - segment.move0) * u,
    join: segment.join0 + (segment.join1 - segment.join0) * u,
    caption: segment.caption,
    step: segment.step,
    fade: clamp(fade, 0, 1),
    zoom: segment.zoom0 + (segment.zoom1 - segment.zoom0) * u,
  };
}

export type BuiltEdge = {
  a: number[];
  b: number[];
  kind: "old" | "copy" | "join";
  progress: number;
};

function joinProgress(join: number, index: number, count: number) {
  if (count <= 1) return join;
  const span = 0.38;
  const gap = (1 - span) / (count - 1);
  return clamp((join - index * gap) / span, 0, 1);
}

/** Wireframe of a hypercube mid-extrusion. Coordinates live in {0,1}. */
export function buildFigure(dim: number, move: number, join: number): BuiltEdge[] {
  const older = dim - 1;
  const count = 1 << older;
  const base: number[][] = [];
  for (let i = 0; i < count; i++) {
    const p = [0, 0, 0, 0];
    for (let axis = 0; axis < older; axis++) p[axis] = (i >> axis) & 1;
    base.push(p);
  }

  const edges: BuiltEdge[] = [];
  const pushPair = (i: number, j: number, kind: "old" | "copy", shift: number) => {
    const a = [...base[i]];
    const b = [...base[j]];
    a[older] = shift;
    b[older] = shift;
    edges.push({ a, b, kind, progress: 1 });
  };

  for (let i = 0; i < count; i++) {
    for (let axis = 0; axis < older; axis++) {
      const bit = 1 << axis;
      if ((i & bit) !== 0) continue;
      pushPair(i, i | bit, "old", 0);
    }
  }

  if (move > 0.012) {
    for (let i = 0; i < count; i++) {
      for (let axis = 0; axis < older; axis++) {
        const bit = 1 << axis;
        if ((i & bit) !== 0) continue;
        pushPair(i, i | bit, "copy", move);
      }
    }
  }

  if (join > 0 && move > 0.012) {
    base.forEach((p, index) => {
      const progress = joinProgress(join, index, count);
      if (progress <= 0) return;
      const b = [...p];
      b[older] = move;
      edges.push({ a: p, b, kind: "join", progress });
    });
  }

  return edges;
}
