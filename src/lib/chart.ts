"use client";

import { useEffect, useRef, useState } from "react";

const TWEEN_MS = 900;

export type Coord = { x: number; y: number; value: number };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds a peak value up to a readable axis maximum. */
export function niceMax(value: number): number {
  if (value <= 4) return 4;
  return Math.max(Math.ceil(value / 4 / 5) * 5, 5);
}

/** Trailing moving average, so the first days average over fewer samples. */
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}

/** Catmull-Rom converted to cubic bezier, clamped so the curve stays in the plot. */
export function smoothLine(coords: Coord[], floor: number, ceil: number): string {
  const first = coords[0];
  if (!first) return "";
  if (coords.length === 1) return `M ${first.x} ${first.y}`;

  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6, ceil, floor);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6, ceil, floor);

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Same spline, but the last point flows back into the first, for closed rings. */
export function smoothLoop(coords: Coord[]): string {
  const count = coords.length;
  if (count < 3) return "";

  const at = (i: number) => coords[((i % count) + count) % count];
  const tension = 0.16;

  let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < count; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Cartesian point on a circle. 0 degrees is 12 o'clock, angles increase clockwise. */
export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/** Animates every series value toward its target so polling updates slide instead of snap. */
export function useTweenedSeries(target: number[], duration = TWEEN_MS): number[] {
  const [values, setValues] = useState<number[]>(target);
  const currentRef = useRef<number[]>(target);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    const start =
      currentRef.current.length === target.length
        ? from
        : target.map((_, i) => from[i] ?? 0);
    const startedAt = performance.now();

    const step = (now: number) => {
      const t = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = target.map(
        (value, i) => (start[i] ?? 0) + (value - (start[i] ?? 0)) * eased
      );
      currentRef.current = next;
      setValues(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return values;
}

/** Tracks the rendered width of a container so the SVG can stay responsive. */
export function useElementWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
