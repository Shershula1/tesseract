export type Vec4 = [number, number, number, number];

export const TESSERACT_VERTICES: Vec4[] = Array.from({ length: 16 }, (_, i) => [
  i & 1 ? 1 : -1,
  i & 2 ? 1 : -1,
  i & 4 ? 1 : -1,
  i & 8 ? 1 : -1,
]);

export const TESSERACT_EDGES: [number, number][] = [];

for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let diff = 0;
    for (let k = 0; k < 4; k++) {
      if (TESSERACT_VERTICES[i][k] !== TESSERACT_VERTICES[j][k]) diff++;
    }
    if (diff === 1) TESSERACT_EDGES.push([i, j]);
  }
}

function vertexIndex(signs: [number, number, number, number]) {
  return (
    (signs[0] === 1 ? 1 : 0) |
    (signs[1] === 1 ? 2 : 0) |
    (signs[2] === 1 ? 4 : 0) |
    (signs[3] === 1 ? 8 : 0)
  );
}

/** 24 square faces, each a cyclic quad of vertex indices. */
export const TESSERACT_FACES: number[][] = [];

{
  const axes = [0, 1, 2, 3] as const;
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const fixed = axes.filter((axis) => axis !== a && axis !== b);
      for (const s0 of [-1, 1] as const) {
        for (const s1 of [-1, 1] as const) {
          const corner: [number, number, number, number] = [0, 0, 0, 0];
          corner[fixed[0]] = s0;
          corner[fixed[1]] = s1;
          const cycle: [number, number][] = [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ];
          TESSERACT_FACES.push(
            cycle.map(([ua, ub]) => {
              const signs = [...corner] as [number, number, number, number];
              signs[a] = ua;
              signs[b] = ub;
              return vertexIndex(signs);
            }),
          );
        }
      }
    }
  }
}

export function rotXW(v: Vec4, angle: number): Vec4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[3] * s, v[1], v[2], v[0] * s + v[3] * c];
}

/** Central projection onto w = 0 from an eye at (0, 0, 0, distance). */
export function perspective4(v: Vec4, distance: number): [number, number, number, number] {
  const scale = distance / (distance - v[3]);
  return [v[0] * scale, v[1] * scale, v[2] * scale, v[3]];
}

/**
 * Parallel picture of the construction: x right, y up, z oblique,
 * w a second oblique that shifts the copy up and to the right.
 */
export function embedParallel(p: number[]) {
  const x = p[0] ?? 0;
  const y = p[1] ?? 0;
  const z = p[2] ?? 0;
  const w = p[3] ?? 0;
  return {
    x: x + z * 0.75 + w * 2.05,
    y: y + z * 0.46 + w * 1.72,
  };
}
