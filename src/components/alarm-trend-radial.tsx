"use client";

import { useId, useMemo, useState } from "react";
import type { TrendPoint } from "@/lib/analytics";
import {
  clamp,
  movingAverage,
  niceMax,
  polarPoint,
  smoothLoop,
  useElementWidth,
  useTweenedSeries,
  type Coord,
} from "@/lib/chart";
import { Icon } from "@/components/icon";

const MIN_SIZE = 220;
const MAX_SIZE = 340;
const RING_COUNT = 4;
const INNER_RATIO = 0.22;

function ringPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

export function AlarmTrendRadial({ points }: { points: TrendPoint[] }) {
  const gradientId = useId().replace(/:/g, "");
  const { ref, width } = useElementWidth(320);
  const [hover, setHover] = useState<number | null>(null);

  const targetKey = points.map((p) => p.total).join(",");
  const target = useMemo(() => targetKey.split(",").map(Number), [targetKey]);
  const values = useTweenedSeries(target);
  const average = useMemo(() => movingAverage(target, 7), [target]);

  const size = clamp(width || MAX_SIZE, MIN_SIZE, MAX_SIZE);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 26;
  const inner = outer * INNER_RATIO;
  const span = outer - inner;

  const maxValue = useMemo(() => niceMax(Math.max(...target, 0)), [target]);
  const count = Math.max(values.length, 1);
  const step = 360 / count;

  const coords = useMemo<Coord[]>(
    () =>
      values.map((value, i) => {
        const radius = inner + (value / maxValue) * span;
        const p = polarPoint(cx, cy, radius, i * step);
        return { x: p.x, y: p.y, value };
      }),
    [values, maxValue, cx, cy, inner, span, step]
  );

  const seriesPath = smoothLoop(coords);
  const total = useMemo(() => target.reduce((sum, v) => sum + v, 0), [target]);
  const lastAverage = average[average.length - 1] ?? 0;
  const averageRadius = inner + (lastAverage / maxValue) * span;
  const peak = coords.reduce(
    (best, c, i) => (c.value > (coords[best]?.value ?? -1) ? i : best),
    0
  );

  const active = hover === null ? null : coords[hover];
  const activePoint = hover === null ? null : points[hover];
  const activeAverage = hover === null ? null : average[hover];

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - bounds.left - cx;
    const dy = event.clientY - bounds.top - cy;
    if (Math.hypot(dx, dy) < inner) {
      setHover(null);
      return;
    }
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    const index = Math.round(deg / step) % count;
    setHover(index);
  }

  return (
    <figure className="w-full">
      <div ref={ref} className="relative flex w-full justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label="กราฟแนวโน้มจำนวน Alarm 14 วันล่าสุด แบบวงกลม"
          className="block touch-none select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <radialGradient id={`${gradientId}-fill`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
              <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
            </radialGradient>
            <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id={`${gradientId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Array.from({ length: RING_COUNT }, (_, i) => {
            const ratio = (i + 1) / RING_COUNT;
            const r = inner + span * ratio;
            const value = Math.round(maxValue * ratio);
            const label = polarPoint(cx, cy, r, -90);
            return (
              <g key={ratio}>
                <path
                  d={ringPath(cx, cy, r)}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth={1}
                  strokeDasharray="3 5"
                />
                <text
                  x={label.x}
                  y={label.y - 3}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[9px] tabular-nums"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {points.map((p, i) => {
            const deg = i * step;
            const spoke = polarPoint(cx, cy, outer, deg);
            return (
              <line
                key={`spoke-${p.date}`}
                x1={cx}
                y1={cy}
                x2={spoke.x}
                y2={spoke.y}
                stroke="var(--line)"
                strokeWidth={1}
                opacity={hover === i ? 0.5 : 0.18}
              />
            );
          })}

          {active ? (
            <line
              x1={cx}
              y1={cy}
              x2={active.x}
              y2={active.y}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.6}
            />
          ) : null}

          {seriesPath ? (
            <path d={`${seriesPath} Z`} fill={`url(#${gradientId}-fill)`} className="chart-area" />
          ) : null}

          {Number.isFinite(averageRadius) && averageRadius > inner ? (
            <path
              d={ringPath(cx, cy, averageRadius)}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              opacity={0.6}
              className="chart-fade"
            />
          ) : null}

          {seriesPath ? (
            <path
              d={seriesPath}
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
              key={`${c.x}-${c.y}`}
              cx={c.x}
              cy={c.y}
              r={hover === i ? 4.5 : i === peak ? 3.5 : 2.5}
              className="chart-dot"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth={2}
            />
          ))}

          {coords[peak] ? (
            <circle
              cx={coords[peak].x}
              cy={coords[peak].y}
              r={4}
              fill="var(--accent)"
              className="chart-pulse"
            />
          ) : null}

          {points.map((p, i) => {
            if (i % 2 !== 0) return null;
            const deg = i * step;
            const anchor = polarPoint(cx, cy, outer + 12, deg);
            return (
              <text
                key={`label-${p.date}`}
                x={anchor.x}
                y={anchor.y + 3}
                textAnchor="middle"
                className="fill-zinc-500 text-[9px] tabular-nums"
              >
                {p.label}
              </text>
            );
          })}

          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-foreground text-2xl font-semibold tabular-nums"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 13}
            textAnchor="middle"
            className="fill-zinc-500 text-[10px]"
          >
            Alarm 14 วัน
          </text>
        </svg>

        {active && activePoint ? (
          <div
            className="panel pointer-events-none absolute z-10 min-w-[9.5rem] px-3 py-2"
            style={{
              left: clamp(active.x - size / 2, 8, Math.max(size - 160, 8)),
              top: clamp(active.y - 78, 0, size - 96),
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
          <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
          จำนวน Alarm ต่อวัน
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full ring-2 ring-accent" />
          วันที่พบมากที่สุด
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-5 border-t border-dashed border-zinc-500" />
          เฉลี่ย 7 วัน
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px]">
          <Icon name="activity" className="h-3.5 w-3.5" />
          ชี้เมาส์บนวงกลมเพื่อดูรายละเอียดแต่ละวัน
        </span>
      </figcaption>
    </figure>
  );
}
