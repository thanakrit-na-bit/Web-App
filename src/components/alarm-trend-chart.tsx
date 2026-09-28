"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/analytics";
import { AlarmTrendLinear } from "@/components/alarm-trend-linear";
import { AlarmTrendRadial } from "@/components/alarm-trend-radial";

type View = "radial" | "linear";

const VIEWS: { key: View; label: string }[] = [
  { key: "radial", label: "วงกลม" },
  { key: "linear", label: "เส้น" },
];

export function AlarmTrendChart({ points }: { points: TrendPoint[] }) {
  const [view, setView] = useState<View>("radial");

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <div
          className="inline-flex rounded-lg border border-line p-0.5"
          role="group"
          aria-label="เลือกรูปแบบกราฟ"
        >
          {VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              aria-pressed={view === item.key}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === item.key
                  ? "bg-accent text-accent-ink"
                  : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {view === "radial" ? (
        <AlarmTrendRadial points={points} />
      ) : (
        <AlarmTrendLinear points={points} />
      )}
    </div>
  );
}
