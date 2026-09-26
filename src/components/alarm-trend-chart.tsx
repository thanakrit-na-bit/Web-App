import { maxOf, type TrendPoint } from "@/lib/analytics";

const WIDTH = 720;
const HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 34, left: 34 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const step = Math.ceil(value / 4 / 5) * 5;
  return Math.max(step, 5);
}

export function AlarmTrendChart({ points }: { points: TrendPoint[] }) {
  const inChart = points.map((point) => ({
    ...point,
    inProgress: Math.max(point.total - point.open - point.closed, 0),
  }));

  const maxValue = niceMax(maxOf(inChart.map((point) => point.total)));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slot = plotWidth / Math.max(inChart.length, 1);
  const barWidth = Math.min(slot * 0.62, 26);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="กราฟจำนวน Alarm รายวัน"
      >
        {ticks.map((tick) => {
          const y = PADDING.top + plotHeight - (tick / maxValue) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "3 4"}
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {inChart.map((point, i) => {
          const x = PADDING.left + slot * i + (slot - barWidth) / 2;
          const scale = (value: number) => (value / maxValue) * plotHeight;
          const bottom = PADDING.top + plotHeight;

          const segments = [
            { value: point.closed, color: "fill-green-500", label: "Closed" },
            { value: point.open, color: "fill-red-500", label: "Open" },
            { value: point.inProgress, color: "fill-yellow-500", label: "In Progress" },
          ].filter((segment) => segment.value > 0);

          let offset = 0;
          return (
            <g key={point.date}>
              <title>
                {`${point.date}: ทั้งหมด ${point.total} (Open ${point.open}, In Progress ${inChart[i].inProgress}, Closed ${point.closed})`}
              </title>
              {point.total === 0 && (
                <rect
                  x={x}
                  y={bottom - 2}
                  width={barWidth}
                  height={2}
                  className="fill-zinc-200 dark:fill-zinc-800"
                />
              )}
              {segments.map((segment) => {
                const height = scale(segment.value);
                const isTop = offset + height >= plotHeight - 0.5;
                const yPos = bottom - offset;
                offset += height;
                return (
                  <rect
                    key={segment.label}
                    x={x}
                    y={yPos}
                    width={barWidth}
                    height={height}
                    rx={isTop ? 3 : 0}
                    className={`${segment.color} transition-opacity`}
                  />
                );
              })}
              {i % 2 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={HEIGHT - 12}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + plotHeight}
          y2={PADDING.top + plotHeight}
          className="stroke-zinc-300 dark:stroke-zinc-700"
          strokeWidth={1}
        />
      </svg>

      <figcaption className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {[
          { color: "bg-green-500", label: "Closed" },
          { color: "bg-yellow-500", label: "In Progress" },
          { color: "bg-red-500", label: "Open" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} /> {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
