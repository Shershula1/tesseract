"use client";

import { useEffect, useRef, type RefObject } from "react";

export function usePlate(ref: RefObject<HTMLCanvasElement | null>, redraw: () => void) {
  const redrawRef = useRef(redraw);

  useEffect(() => {
    redrawRef.current = redraw;
  });

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const fit = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      redrawRef.current();
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [ref]);
}

export function plateSize(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    dpr,
    width: canvas.width / dpr,
    height: canvas.height / dpr,
  };
}
