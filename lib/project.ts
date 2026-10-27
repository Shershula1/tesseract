import { perspective4, rotXW, TESSERACT_VERTICES, type Vec4 } from "@/lib/hypercube";
import { rotX, rotY } from "@/lib/vec";

export type ScreenPoint = { x: number; y: number; z: number; w: number };

const EYE_W = 3.2;
const FOCAL = 4.4;

export function projectTesseract(theta: number, yaw: number, pitch: number): ScreenPoint[] {
  return TESSERACT_VERTICES.map((vertex) => projectVertex(vertex, theta, yaw, pitch));
}

export function projectVertex(vertex: Vec4, theta: number, yaw: number, pitch: number): ScreenPoint {
  const rotated = rotXW(vertex, theta);
  const solid = perspective4(rotated, EYE_W);
  const turned = rotX(rotY([solid[0], solid[1], solid[2]], yaw), pitch);
  const scale = FOCAL / (FOCAL + turned[2]);
  return {
    x: turned[0] * scale,
    y: turned[1] * scale,
    z: turned[2],
    w: rotated[3],
  };
}
