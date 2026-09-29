import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { StatusBadge } from "@/components/status-badge";
import { AlarmTrendPanel } from "@/components/alarm-trend-panel";
import { StatCard } from "@/components/stat-card";
import { Card, CardTitle } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { buildAlarmTrend, buildStatusSummary } from "@/lib/analytics";
import { APP_TIMEZONE } from "@/lib/time";
import { buildNotifications } from "@/lib/notifications";
import type { Alarm, Maintenance } from "@/lib/types";

const getStats = cache(async () => {
  const supabase = await createClient();

  const [machinesCount, runningCount, stopCount, alarmMachinesCount, maintenanceMachinesCount] =
    await Promise.all([
      supabase.from("machines").select("id", { count: "exact", head: true }),
      supabase.from("machines").select("id", { count: "exact", head: true }).eq("status", "Running"),
      supabase.from("machines").select("id", { count: "exact", head: true }).eq("status", "Stop"),
      supabase.from("machines").select("id", { count: "exact", head: true }).eq("status", "Alarm"),
      supabase.from("machines").select("id", { count: "exact", head: true }).eq("status", "Maintenance"),
    ]);

  const [alarms, openAlarms, inProgressAlarms, closedAlarms, maintenance] =
    await Promise.all([
      supabase.from("alarms").select("id", { count: "exact", head: true }),
      supabase.from("alarms").select("id", { count: "exact", head: true }).eq("status", "Open"),
      supabase.from("alarms").select("id", { count: "exact", head: true }).eq("status", "In Progress"),
      supabase.from("alarms").select("id", { count: "exact", head: true }).eq("status", "Closed"),
      supabase.from("maintenance_records").select("id", { count: "exact", head: true }),
    ]);

  if (
    machinesCount.error || maintenanceMachinesCount.error || alarms.error || maintenance.error
  ) {
    return null;
  }

  return {
    machines: machinesCount.count ?? 0,
    running: runningCount.count ?? 0,
    stop: stopCount.count ?? 0,
    machineAlarm: alarmMachinesCount.count ?? 0,
    machineMaintenance: maintenanceMachinesCount.count ?? 0,
    alarms: alarms.count ?? 0,
    openAlarms: openAlarms.count ?? 0,
    inProgressAlarms: inProgressAlarms.count ?? 0,
    closedAlarms: closedAlarms.count ?? 0,
    maintenance: maintenance.count ?? 0,
  };
});

function StatusBar({
  slices,
}: {
  slices: { label: string; value: number; percent: number; color: string; glow: string }[];
}) {
  return (
    <div className="space-y-4">
      {slices.map((s) => (
        <div key={s.label} className="group">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {s.label}{" "}
              <span className="tabular-nums text-zinc-400">({s.value})</span>
            </span>
            <span className="tabular-nums text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
              {s.percent}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${s.color} transition-[width] duration-700 ease-out`}
              style={{
                width: `${Math.max(s.percent, s.value > 0 ? 4 : 0)}%`,
                boxShadow: `0 0 14px -3px ${s.glow}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTimeShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getStats();
  const supabase = await createClient();

  const [recentAlarmsRes, upcomingMaintenanceRes, trendAlarmsRes] = await Promise.all([
    supabase
      .from("alarms")
      .select("*, machines(machine_id, machine_name)")
      .neq("status", "Closed")
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("maintenance_records")
      .select("*, machines(machine_id, machine_name)")
      .in("status", ["Scheduled", "In Progress"])
      .order("maintenance_date", { ascending: true })
      .limit(5),
    supabase
      .from("alarms")
      .select("occurred_at, status")
      .order("occurred_at", { ascending: false })
      .limit(500),
  ]);

  const recentAlarms = (recentAlarmsRes.data ?? []) as Alarm[];
  const upcomingMaintenance = (upcomingMaintenanceRes.data ?? []) as Maintenance[];
  const trend = buildAlarmTrend(
    (trendAlarmsRes.data ?? []) as { occurred_at: string; status: string }[]
  );

  const alertNotifications = buildNotifications({
    alarms: (recentAlarms as Alarm[]).map((a) => ({
      id: a.id,
      alarm_code: a.alarm_code,
      status: a.status,
      occurred_at: a.occurred_at,
      machineLabel: a.machines?.machine_id ?? null,
    })),
    maintenance: (upcomingMaintenance as Maintenance[]).map((m) => ({
      id: m.id,
      status: m.status,
      maintenance_date: m.maintenance_date,
      machineLabel: m.machines?.machine_id ?? null,
    })),
  });

  if (!stats) {
    return <p className="text-sm text-red-600">ไม่สามารถโหลดข้อมูลได้</p>;
  }

  const machineStatusBar = buildStatusSummary([
    { label: "Running", value: stats.running },
    { label: "Stop", value: stats.stop },
    { label: "Alarm", value: stats.machineAlarm },
    { label: "Maintenance", value: stats.machineMaintenance },
  ]).map((slice, i) => ({
    ...slice,
    color: ["bg-green-500", "bg-zinc-400", "bg-red-500", "bg-accent"][i],
    glow: ["rgb(34 197 94 / 0.55)", "rgb(148 156 165 / 0.4)", "rgb(239 68 68 / 0.55)", "var(--accent)"][i],
  }));

  const alarmStatusBar = buildStatusSummary([
    { label: "Open", value: stats.openAlarms },
    { label: "In Progress", value: stats.inProgressAlarms },
    { label: "Closed", value: stats.closedAlarms },
  ]).map((slice, i) => ({
    ...slice,
    color: ["bg-red-500", "bg-yellow-500", "bg-green-500"][i],
    glow: ["rgb(239 68 68 / 0.55)", "rgb(234 179 8 / 0.55)", "rgb(34 197 94 / 0.55)"][i],
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        icon="dashboard"
        title="Dashboard"
        description={`ยินดีต้อนรับ ${user.full_name ?? user.email} กลับมา`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="เครื่องจักรทั้งหมด"
          value={stats.machines}
          color="text-zinc-900 dark:text-zinc-100"
          icon="machine"
          chip="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          footnote={`ทำงาน ${stats.running} · หยุด ${stats.stop} · ซ่อม ${stats.machineMaintenance}`}
        />
        <StatCard
          delay={60}
          label="เครื่องจักรแจ้ง Alarm"
          value={stats.machineAlarm}
          color="text-red-600 dark:text-red-400"
          icon="alarm"
          chip="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
          footnote="เครื่องจักรที่ยังแจ้งเตือนอยู่"
        />
        <StatCard
          delay={120}
          label="รายการ Alarm ทั้งหมด"
          value={stats.alarms}
          color="text-amber-600 dark:text-amber-400"
          icon="activity"
          chip="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          spark={trend.map((p) => p.total)}
          sparkTint="var(--accent)"
          footnote={`14 วันล่าสุด · ${trend.reduce((sum, p) => sum + p.total, 0)} รายการ`}
        />
        <StatCard
          delay={180}
          label="งานบำรุงรักษา"
          value={stats.maintenance}
          color="text-accent"
          icon="wrench"
          chip="bg-accent-soft text-accent"
          footnote={`เปิดค้าง ${stats.openAlarms} alarm · กำลังซ่อม ${stats.inProgressAlarms}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card delay={120}>
          <CardTitle icon="machine">สถานะเครื่องจักร (Machine Status)</CardTitle>
          <StatusBar slices={machineStatusBar} />
        </Card>

        <Card delay={180}>
          <CardTitle icon="alarm">สถานะ Alarm</CardTitle>
          <StatusBar slices={alarmStatusBar} />
        </Card>
      </div>

      <AlarmTrendPanel initial={trend} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card delay={300}>
          <CardTitle
            icon="alarm"
            action={
              <Link
                href="/alarms"
                className="flex items-center gap-0.5 text-xs font-medium text-accent hover:underline"
              >
                ดูทั้งหมด
                <Icon name="chevron-right" className="h-3.5 w-3.5" />
              </Link>
            }
          >
            Alarm ที่ยังเปิดอยู่
          </CardTitle>
          {recentAlarms.length === 0 ? (
            <EmptyState icon="check" title="ไม่มี Alarm ค้างอยู่" hint="ทุกเครื่องจักรทำงานปกติครับ" />
          ) : (
            <ul className="scroll-slim -mx-1 divide-y divide-line">
              {recentAlarms.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 px-1 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {a.alarm_code} · {a.machines?.machine_id}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTimeShort(a.occurred_at)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card delay={340}>
          <CardTitle
            icon="wrench"
            action={
              <Link
                href="/maintenance"
                className="flex items-center gap-0.5 text-xs font-medium text-accent hover:underline"
              >
                ดูทั้งหมด
                <Icon name="chevron-right" className="h-3.5 w-3.5" />
              </Link>
            }
          >
            งานซ่อมที่ถึงกำหนด
          </CardTitle>
          {upcomingMaintenance.length === 0 ? (
            <EmptyState icon="check" title="ไม่มีงานซ่อมค้างอยู่" hint="งานบำรุงรักษาทั้งหมดเสร็จสิ้นแล้ว" />
          ) : (
            <ul className="scroll-slim -mx-1 divide-y divide-line">
              {upcomingMaintenance.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 px-1 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {r.maintenance_date} · {r.machines?.machine_id}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {r.problem}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card delay={380}>
        <CardTitle
          icon="bell"
          action={
            <span className="text-xs text-zinc-400">{alertNotifications.length} รายการ</span>
          }
        >
          สิ่งที่ต้องแจ้งเตือน
        </CardTitle>
        {alertNotifications.length === 0 ? (
          <EmptyState icon="check" title="ไม่มีรายการที่ต้องแจ้งเตือน" hint="ระบบทำงานปกติ ไม่มี Alarm ค้างหรืองานเกินกำหนด" />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {alertNotifications.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg border border-line p-3 transition-colors hover:border-accent/40 hover:bg-sunken"
                >
                  <StatusBadge status={item.severity} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.detail}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}