import { daysBetween, toDateKey } from "@/lib/analytics";

export type NotificationKind = "alarm" | "maintenance";
export type NotificationSeverity = "critical" | "warning" | "info";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  href: string;
  at: string;
};

export const NOTIFICATION_RULES = {
  staleAlarmHours: 24,
  overdueMaintenanceDays: 3,
  criticalMaintenanceDays: 7,
} as const;

export const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export type AlarmNotificationInput = {
  id: string;
  alarm_code: string;
  status: string;
  occurred_at: string;
  machineLabel?: string | null;
};

export type MaintenanceNotificationInput = {
  id: string;
  status: string;
  maintenance_date: string;
  machineLabel?: string | null;
};

function machinePrefix(label?: string | null): string {
  return label ? `[${label}] ` : "";
}

export function buildNotifications({
  alarms,
  maintenance,
  now = new Date(),
}: {
  alarms: AlarmNotificationInput[];
  maintenance: MaintenanceNotificationInput[];
  now?: Date;
}): AppNotification[] {
  const items: AppNotification[] = [];

  for (const alarm of alarms) {
    if (alarm.status === "Closed") continue;

    const occurred = new Date(alarm.occurred_at);
    const ageHours = Number.isNaN(occurred.getTime())
      ? 0
      : (now.getTime() - occurred.getTime()) / 3_600_000;

    if (alarm.status === "Open") {
      const stale = ageHours >= NOTIFICATION_RULES.staleAlarmHours;
      items.push({
        id: `alarm-${alarm.id}`,
        kind: "alarm",
        severity: stale ? "critical" : "warning",
        title: `Alarm ${alarm.alarm_code} ยังไม่ปิด`,
        detail: `${machinePrefix(alarm.machineLabel)}${stale
          ? `ค้างมา ${Math.floor(ageHours)} ชั่วโมง`
          : "เพิ่งเกิด ให้ตรวจสอบเครื่องจักร"}`,
        href: "/alarms",
        at: alarm.occurred_at,
      });
      continue;
    }

    items.push({
      id: `alarm-${alarm.id}`,
      kind: "alarm",
      severity: "info",
      title: `Alarm ${alarm.alarm_code} กำลังดำเนินการ`,
      detail: `${machinePrefix(alarm.machineLabel)}ช่างกำลังแก้ไขอยู่`,
      href: "/alarms",
      at: alarm.occurred_at,
    });
  }

  const today = toDateKey(now);

  for (const record of maintenance) {
    const machine = machinePrefix(record.machineLabel);

    if (record.status === "In Progress") {
      items.push({
        id: `maintenance-${record.id}`,
        kind: "maintenance",
        severity: "info",
        title: "งานซ่อมกำลังดำเนินการ",
        detail: `${machine}กำหนดวันที่ ${record.maintenance_date}`,
        href: "/maintenance",
        at: `${record.maintenance_date}T00:00:00`,
      });
      continue;
    }

    if (record.status !== "Scheduled") continue;
    if (!record.maintenance_date || record.maintenance_date >= today) continue;

    const overdue = daysBetween(new Date(`${record.maintenance_date}T00:00:00`), now);
    items.push({
      id: `maintenance-${record.id}`,
      kind: "maintenance",
      severity:
        overdue >= NOTIFICATION_RULES.criticalMaintenanceDays ? "critical" : "warning",
      title: "งานซ่อมเกินกำหนด",
      detail: `${machine}เลยกำหนดมา ${overdue} วัน (${record.maintenance_date})`,
      href: "/maintenance",
      at: `${record.maintenance_date}T00:00:00`,
    });
  }

  return items.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return new Date(b.at).getTime() - new Date(a.at).getTime();
  });
}

export function countBySeverity(
  notifications: AppNotification[]
): Record<NotificationSeverity, number> {
  return notifications.reduce(
    (acc, item) => {
      acc[item.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 } as Record<NotificationSeverity, number>
  );
}
