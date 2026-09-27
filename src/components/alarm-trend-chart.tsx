"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { TrendPoint } from "@/lib/analytics";
import { Icon } from "@/components/icon";

const HEIGHT = 268;
const PAD = { top: 22, right: 18, bottom: 30, left: 34 };
const TWEEN_MS = 900;

function niceMax(value: number): number {
  if (value <= 4) return 4;
  return Math.max(Math.ceil(value / 4 / 5) * 5, 5);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type Coord = { x: number; y: number; value: number };

/** Catmull-Rom converted to cubic bezier, clamped so the curve never dips below the axis. */
function smoothLine(coords: Coord[], floor: number, ceil: number): string {
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

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}

/** Animates every series value toward its target so polling updates slide instead of snap. */
function useTweenedSeries(target: number[], duration = TWEEN_MS): number[] {
  const [values, setValues] = useState<number[]>(target);
  const currentRef = useRef<number[]>(target);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    const start = currentRef.current.length === target.length
      ? from
      : target.map((_, i) => from[i] ?? 0);
    const startedAt = performance.now();

    const step = (now: number) => {
      const t = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = target.map((value, i) => (start[i] ?? 0) + (value - (start[i] ?? 0)) * eased);
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

function useElementWidth(fallback: number) {
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

export function AlarmTrendChart({ points }: { points: TrendPoint[] }) {
  const gradientId = useId().replace(/:/g, "");
  const lineId = useId().replace(/:/g, "");
  const { ref, width } = useElementWidth(760);
  const [hover, setHover] = useState<number | null>(null);

  const targetKey = points.map((p) => p.total).join(",");
  const target = useMemo(() => targetKey.split(",").map(Number), [targetKey]);
  const values = useTweenedSeries(target);

  const maxValue = useMemo(() => niceMax(Math.max(...target, 0)), [target]);
  const plotWidth = Math.max(width - PAD.left - PAD.right, 10);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotHeight;
  const slot = plotWidth / Math.max(values.length, 1);

  const coords = useMemo<Coord[]>(
    () =>
      values.map((value, i) => ({
        x: PAD.left + slot * i + slot / 2,
        y: baseline - (value / maxValue) * plotHeight,
        value,
      })),
    [values, slot, maxValue, baseline, plotHeight]
  );

  const average = useMemo(() => movingAverage(target, 7), [target]);

  const averageCoords = useMemo<Coord[]>(
    () =>
      average.map((value, i) => ({
        x: PAD.left + slot * i + slot / 2,
        y: baseline - (value / maxValue) * plotHeight,
        value,
      })),
    [average, slot, maxValue, baseline, plotHeight]
  );

  const linePath = smoothLine(coords, baseline, PAD.top);
  const averagePath = smoothLine(averageCoords, baseline, PAD.top);
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${baseline} L ${coords[0].x.toFixed(2)} ${baseline} Z`
    : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));
  const last = coords[coords.length - 1];
  const active = hover === null ? null : coords[hover];
  const activePoint = hover === null ? null : points[hover];
  const activeAverage = hover === null ? null : average[hover];

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const index = Math.round((x - PAD.left - slot / 2) / slot);
    setHover(index >= 0 && index < coords.length ? index : null);
  }

  return (
    <figure className="w-full">
      <div ref={ref} className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="กราฟแนวโน้มจำนวน Alarm 14 วันล่าสุด"
          className="block touch-none select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.34" />
              <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id={`${gradientId}-glow`} x="-40%" y="-60%" width="180%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {ticks.map((tick) => {
            const y = baseline - (tick / maxValue) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : "3 5"}
                />
                <text
                  x={PAD.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-500 text-[10px] tabular-nums dark:fill-zinc-500"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {areaPath ? (
            <path d={areaPath} fill={`url(#${gradientId}-fill)`} className="chart-area" />
          ) : null}

          {averagePath ? (
            <path
              d={averagePath}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              strokeLinecap="round"
              opacity={0.6}
              className="chart-fade"
            />
          ) : null}

          {linePath ? (
            <path
              id={lineId}
              d={linePath}
              fill="none"
              stroke={`url(#${gradientId}-stroke)`}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              filter={`url(#${gradientId}-glow)`}
              className="chart-line"
            />
          ) : null}

          {coords.map((c, i) => (
            <circle
              key={c.x}
              cx={c.x}
              cy={c.y}
              r={hover === i ? 4.5 : i === coords.length - 1 ? 3.5 : 2.5}
              className="chart-dot"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth={2}
            />
          ))}

          {last ? (
            <>
              <circle cx={last.x} cy={last.y} r={4} fill="var(--accent)" className="chart-pulse" />
              <circle cx={last.x} cy={last.y} r={2.5} fill="var(--accent-ink)" />
            </>
          ) : null}

          {active ? (
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={baseline}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.55}
            />
          ) : null}

          {points.map((p, i) =>
            i % 2 === 0 ? (
              <text
                key={p.date}
                x={PAD.left + slot * i + slot / 2}
                y={HEIGHT - 10}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px] tabular-nums dark:fill-zinc-500"
              >
                {p.label}
              </text>
            ) : null
          )}
        </svg>

        {active && activePoint ? (
          <div
            className="panel pointer-events-none absolute z-10 min-w-[9.5rem] -translate-x-1/2 px-3 py-2"
            style={{
              left: clamp(active.x, 60, Math.max(width - 60, 60)),
              top: clamp(active.y - 12, 0, HEIGHT - 90),
            }}
          >
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {activePoint.date}
            </p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {Math.round(active.value)}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">รายการ</span>
            </p>
            <p className="mt-1 flex flex-col gap-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center justify-between gap-3">
                <span>Open</span>
                <span className="tabular-nums text-red-400">{activePoint.open}</span>
              </span>
              <span className="flex items-center justify-between gap-3">
                <span>Closed</span>
                <span className="tabular-nums text-green-400">{activePoint.closed}</span>
              </span>
              <span className="flex items-center justify-between gap-3 border-t border-line pt-1">
                <span>เฉลี่ย 7 วัน</span>
                <span className="tabular-nums">{(activeAverage ?? 0).toFixed(1)}</span>
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-accent" />
          จำนวน Alarm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-5 border-t border-dashed border-zinc-500" />
          เฉลี่ย 7 วัน
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px]">
          <Icon name="activity" className="h-3.5 w-3.5" />
          ชี้เมาส์เพื่อดูรายละเอียดแต่ละวัน
        </span>
      </figcaption>
    </figure>
  );
}
