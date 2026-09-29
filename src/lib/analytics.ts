import {
  APP_TIMEZONE,
  addDaysToKey,
  labelFromKey,
  toDateKey as zonedDateKey,
} from "@/lib/time";

export type TrendPoint = {
  date: string;
  label: string;
  total: number;
  open: number;
  inProgress: number;
  closed: number;
};

export type StatusSlice = {
  label: string;
  value: number;
  percent: number;
};

export function toDateKey(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  return zonedDateKey(value, timeZone);
}

export function daysBetween(
  from: string | Date,
  to: string | Date,
  timeZone: string = APP_TIMEZONE
): number {
  const start = zonedDateKey(from, timeZone);
  const end = zonedDateKey(to, timeZone);
  if (!start || !end) return 0;

  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const fromUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const toUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

export type TrendAlarm = {
  occurred_at: string;
  status: string;
};

export function buildAlarmTrend(
  alarms: TrendAlarm[],
  days = 14,
  now: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): TrendPoint[] {
  const todayKey = zonedDateKey(now, timeZone);
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(addDaysToKey(todayKey, -offset));
  }
  const index = new Map(keys.map((key, i) => [key, i]));

  const points: TrendPoint[] = keys.map((key) => ({
    date: key,
    label: labelFromKey(key),
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
  }));

  for (const alarm of alarms) {
    const position = index.get(zonedDateKey(alarm.occurred_at, timeZone));
    if (position === undefined) continue;
    const point = points[position];
    point.total += 1;
    if (alarm.status === "Open") point.open += 1;
    if (alarm.status === "In Progress") point.inProgress += 1;
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
