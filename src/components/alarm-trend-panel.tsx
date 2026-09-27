"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAlarmTrend } from "@/app/actions/analytics";
import type { TrendPoint } from "@/lib/analytics";
import { AlarmTrendChart } from "@/components/alarm-trend-chart";
import { Card } from "@/components/card";
import { Icon } from "@/components/icon";

const POLL_MS = 10_000;

function clockLabel(at: number): string {
  return new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AlarmTrendPanel({ initial }: { initial: TrendPoint[] }) {
  const [points, setPoints] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const keyRef = useRef(initial.map((p) => p.total).join(","));

  const load = useCallback(async () => {
    setBusy(true);
    const result = await fetchAlarmTrend(14);
    setBusy(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setError("");
    setUpdatedAt(result.at);
    const key = result.points.map((p) => p.total).join(",");
    if (key !== keyRef.current) {
      keyRef.current = key;
      setPulse(true);
      window.setTimeout(() => setPulse(false), 900);
    }
    setPoints(result.points);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const total = points.reduce((sum, point) => sum + point.total, 0);
  const activeDays = points.filter((point) => point.total > 0).length;
  const peak = points.reduce((best, point) => (point.total > best.total ? point : best), points[0]);

  return (
    <Card delay={240} className="relative overflow-hidden">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-accent-soft text-accent">
            <Icon name="activity" />
            <span
              className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ${
                pulse ? "animate-ping" : "animate-pulse"
              }`}
            />
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              แนวโน้มจำนวน Alarm 14 วันล่าสุด
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-green-500">
                Live
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              อัปเดตอัตโนมัติทุก 10 วินาที
              {updatedAt ? ` · ล่าสุด ${clockLabel(updatedAt)}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-4 rounded-xl border border-line bg-sunken px-3.5 py-2 sm:flex">
            <span className="text-center">
              <span className="block text-base font-semibold tabular-nums leading-none text-foreground">
                {total}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                รวม
              </span>
            </span>
            <span className="h-7 w-px bg-line" />
            <span className="text-center">
              <span className="block text-base font-semibold tabular-nums leading-none text-foreground">
                {activeDays}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                วันที่มีงาน
              </span>
            </span>
            <span className="h-7 w-px bg-line" />
            <span className="text-center">
              <span className="block text-base font-semibold tabular-nums leading-none text-accent">
                {peak ? `${peak.total} · ${peak.label}` : "-"}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                สูงสุด
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            aria-label="รีเฟรชข้อมูล"
            className="icon-btn"
          >
            <Icon name="activity" className={`h-[18px] w-[18px] ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <AlarmTrendChart points={points} />
    </Card>
  );
}
