"use client";

import { useMemo, useState } from "react";
import type { TrendPoint } from "@/lib/analytics";
import {
  clamp,
  movingAverage,
  niceMax,
  useElementWidth,
  useTweenedSeries,
} from "@/lib/chart";
import { Icon } from "@/components/icon";

const HEIGHT = 268;
const PAD = { top: 22, right: 18, bottom: 30, left: 34 };

const SERIES = [
  { key: "closed", label: "Closed", fill: "fill-green-500 dark:fill-green-400" },
  {
    key: "inProgress",
    label: "In Progress",
    fill: "fill-amber-500 dark:fill-amber-400",
  },
  { key: "open", label: "Open", fill: "fill-red-500 dark:fill-red-400" },
] as const;

export function AlarmTrendBars({ points }: { points: TrendPoint[] }) {
  const { ref, width } = useElementWidth(760);
  const [hover, setHover] = useState<number | null>(null);

  const openKey = points.map((p) => p.open).join(",");
  const progressKey = points.map((p) => p.inProgress).join(",");
  const closedKey = points.map((p) => p.closed).join(",");
  const totalKey = points.map((p) => p.total).join(",");

  const openValues = useTweenedSeries(
    useMemo(() => openKey.split(",").map(Number), [openKey])
  );
  const progressValues = useTweenedSeries(
    useMemo(() => progressKey.split(",").map(Number), [progressKey])
  );
  const closedValues = useTweenedSeries(
    useMemo(() => closedKey.split(",").map(Number), [closedKey])
  );

  const totals = useMemo(() => totalKey.split(",").map(Number), [totalKey]);
  const maxValue = useMemo(() => niceMax(Math.max(...totals, 0)), [totals]);
  const average = useMemo(() => movingAverage(totals, 7), [totals]);

  const plotWidth = Math.max(width - PAD.left - PAD.right, 10);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotHeight;
  const count = Math.max(points.length, 1);
  const slot = plotWidth / count;
  const barWidth = Math.min(slot * 0.62, 26);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));
  const activePoint = hover === null ? null : points[hover];
  const activeTotal = hover === null ? 0 : totals[hover];
  const activeAverage = hover === null ? 0 : average[hover];
  const activeX = hover === null ? 0 : PAD.left + slot * hover + slot / 2;

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const index = Math.floor((x - PAD.left) / slot);
    setHover(index >= 0 && index < points.length ? index : null);
  }

  return (
    <figure className="w-full">
      <div ref={ref} className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="กราฟแท่งจำนวน Alarm 14 วันล่าสุด แยกตามสถานะ"
          className="block touch-none select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
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

          {points.map((point, i) => {
            const x = PAD.left + slot * i + (slot - barWidth) / 2;
            const segments = [
              { value: closedValues[i] ?? 0, fill: SERIES[0].fill },
              { value: progressValues[i] ?? 0, fill: SERIES[1].fill },
              { value: openValues[i] ?? 0, fill: SERIES[2].fill },
            ];

            let cursor = baseline;
            return (
              <g key={point.date} className="chart-fade">
                {segments.map((segment, order) => {
                  if (segment.value <= 0) return null;
                  const raw = (segment.value / maxValue) * plotHeight;
                  const barHeight = Math.max(raw, 2);
                  const y = cursor - barHeight;
                  cursor = y;
                  return (
                    <rect
                      key={order}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={2}
                      className={`${segment.fill} ${
                        hover === null || hover === i ? "opacity-100" : "opacity-45"
                      } transition-opacity`}
                    />
                  );
                })}
              </g>
            );
          })}

          {hover !== null ? (
            <line
              x1={PAD.left + slot * hover + 0.5}
              x2={PAD.left + slot * hover + 0.5}
              y1={PAD.top}
              y2={baseline}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.5}
            />
          ) : null}

          {points.map((point, i) =>
            i % 2 === 0 ? (
              <text
                key={point.date}
                x={PAD.left + slot * i + slot / 2}
                y={HEIGHT - 10}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px] tabular-nums dark:fill-zinc-500"
              >
                {point.label}
              </text>
            ) : null
          )}
        </svg>

        {activePoint ? (
          <div
            className="panel pointer-events-none absolute z-10 min-w-[9.5rem] -translate-x-1/2 px-3 py-2"
            style={{
              left: clamp(activeX, 60, Math.max(width - 60, 60)),
              top: 0,
            }}
          >
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {activePoint.date}
            </p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {Math.round(activeTotal)}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">รายการ</span>
            </p>
            <p className="mt-1 flex flex-col gap-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Open
                </span>
                <span className="tabular-nums text-red-400">{activePoint.open}</span>
              </span>
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  In Progress
                </span>
                <span className="tabular-nums text-amber-400">
                  {activePoint.inProgress}
                </span>
              </span>
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Closed
                </span>
                <span className="tabular-nums text-green-400">
                  {activePoint.closed}
                </span>
              </span>
              <span className="flex items-center justify-between gap-3 border-t border-line pt-1">
                <span>เฉลี่ย 7 วัน</span>
                <span className="tabular-nums">{activeAverage.toFixed(1)}</span>
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {SERIES.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.fill}`} />
            {item.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[11px]">
          <Icon name="activity" className="h-3.5 w-3.5" />
          ชี้เมาส์เพื่อดูรายละเอียดแต่ละวัน
        </span>
      </figcaption>
    </figure>
  );
}
