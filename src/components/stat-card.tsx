"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icon";

function useCountUp(value: number, duration = 700): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    const startedAt = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      setDisplay(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return display;
}

function Sparkline({ values, tint }: { values: number[]; tint: string }) {
  const path = useMemo(() => {
    if (values.length < 2) return "";
    const max = Math.max(...values, 1);
    const width = 100;
    const height = 26;
    return values
      .map((value, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - (value / max) * (height - 3) - 1.5;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values]);

  if (!path) return null;

  return (
    <svg
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      aria-hidden
      className="h-6 w-full opacity-80"
    >
      <path
        d={`${path} L 100 26 L 0 26 Z`}
        fill={tint}
        fillOpacity={0.12}
        stroke="none"
      />
      <path
        d={path}
        fill="none"
        stroke={tint}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  color,
  icon,
  chip,
  delay = 0,
  spark,
  sparkTint,
  footnote,
}: {
  label: string;
  value: number;
  color: string;
  icon: IconName;
  chip: string;
  delay?: number;
  spark?: number[];
  sparkTint?: string;
  footnote?: string;
}) {
  const display = useCountUp(value);

  return (
    <div
      className="surface sheen animate-rise group relative overflow-hidden p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/40"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-tight text-zinc-500 dark:text-zinc-400">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10 ${chip}`}
        >
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>

      <p className={`mt-2.5 text-3xl font-semibold tabular-nums leading-none tracking-tight ${color}`}>
        {display}
      </p>

      {spark && spark.length > 1 ? (
        <div className="-mx-1 mt-3">
          <Sparkline values={spark} tint={sparkTint ?? "var(--accent)"} />
        </div>
      ) : null}

      {footnote ? (
        <p className="mt-2 truncate text-[11px] text-zinc-400 dark:text-zinc-500">{footnote}</p>
      ) : null}
    </div>
  );
}
