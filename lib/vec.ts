export type V3 = [number, number, number];

export function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function mul(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function dot(a: V3, b: V3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function norm(a: V3): V3 {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
}

export function rotX(v: V3, angle: number): V3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

export function rotY(v: V3, angle: number): V3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

export type Camera = {
  eye: V3;
  forward: V3;
  right: V3;
  up: V3;
};

export function makeCamera(eye: V3, target: V3): Camera {
  const forward = norm(sub(target, eye));
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { eye, forward, right, up };
}

export function camProject(cam: Camera, p: V3, focal: number) {
  const rel = sub(p, cam.eye);
  const x = dot(rel, cam.right);
  const y = dot(rel, cam.up);
  const z = dot(rel, cam.forward);
  const s = focal / Math.max(0.15, z);
  return { x: x * s, y: y * s, z };
}
