export type TrendPoint = {
  date: string;
  label: string;
  total: number;
  open: number;
  closed: number;
};

export type StatusSlice = {
  label: string;
  value: number;
  percent: number;
};

export function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

export type TrendAlarm = {
  occurred_at: string;
  status: string;
};

export function buildAlarmTrend(
  alarms: TrendAlarm[],
  days = 14,
  now: Date = new Date()
): TrendPoint[] {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    keys.push(toDateKey(day));
  }
  const index = new Map(keys.map((key, i) => [key, i]));

  const points: TrendPoint[] = keys.map((key) => {
    const date = new Date(`${key}T00:00:00`);
    return {
      date: key,
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      total: 0,
      open: 0,
      closed: 0,
    };
  });

  for (const alarm of alarms) {
    const position = index.get(toDateKey(alarm.occurred_at));
    if (position === undefined) continue;
    const point = points[position];
    point.total += 1;
    if (alarm.status === "Open") point.open += 1;
    if (alarm.status === "Closed") point.closed += 1;
  }

  return points;
}

export function buildStatusSummary(
  counts: { label: string; value: number }[]
): StatusSlice[] {
  const total = counts.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = Math.max(total, 1);
  return counts.map((item) => ({
    ...item,
    percent: Math.round((item.value / safeTotal) * 100),
  }));
}

export function maxOf(values: number[]): number {
  return Math.max(0, ...values);
}
