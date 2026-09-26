import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { StatusBadge } from "@/components/status-badge";
import { AlarmTrendChart } from "@/components/alarm-trend-chart";
import { Card, CardTitle } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Icon, type IconName } from "@/components/icon";
import { buildAlarmTrend, buildStatusSummary } from "@/lib/analytics";
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

function StatCard({
  label,
  value,
  color,
  icon,
  chip,
  delay = 0,
}: {
  label: string;
  value: number;
  color: string;
  icon: IconName;
  chip: string;
  delay?: number;
}) {
  return (
    <div
      className="surface animate-rise p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-tight text-zinc-500 dark:text-zinc-400">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${chip}`}
        >
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-2.5 text-2xl font-semibold tabular-nums tracking-tight ${color}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBar({ slices }: { slices: { label: string; value: number; percent: number; color: string }[] }) {
  return (
    <div className="space-y-3.5">
      {slices.map((s) => (
        <div key={s.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {s.label} <span className="tabular-nums text-zinc-400">({s.value})</span>
            </span>
            <span className="tabular-nums text-zinc-400">{s.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${s.color} transition-[width] duration-700 ease-out`}
              style={{ width: `${s.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
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
    color: ["bg-green-500", "bg-yellow-500", "bg-red-500", "bg-blue-500"][i],
  }));

  const alarmStatusBar = buildStatusSummary([
    { label: "Open", value: stats.openAlarms },
    { label: "In Progress", value: stats.inProgressAlarms },
    { label: "Closed", value: stats.closedAlarms },
  ]).map((slice, i) => ({
    ...slice,
    color: ["bg-red-500", "bg-yellow-500", "bg-green-500"][i],
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
        />
        <StatCard
          delay={60}
          label="เครื่องจักรแจ้ง Alarm"
          value={stats.machineAlarm}
          color="text-red-600 dark:text-red-400"
          icon="alarm"
          chip="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
        />
        <StatCard
          delay={120}
          label="รายการ Alarm ทั้งหมด"
          value={stats.alarms}
          color="text-amber-600 dark:text-amber-400"
          icon="activity"
          chip="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <StatCard
          delay={180}
          label="งานบำรุงรักษา"
          value={stats.maintenance}
          color="text-accent"
          icon="wrench"
          chip="bg-accent-soft text-accent"
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

      <Card delay={240}>
        <CardTitle
          icon="activity"
          action={
            <span className="text-xs text-zinc-400">
              รวม {trend.reduce((sum, point) => sum + point.total, 0)} รายการ
            </span>
          }
        >
          แนวโน้มจำนวน Alarm 14 วันล่าสุด
        </CardTitle>
        <AlarmTrendChart points={trend} />
      </Card>

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
                      {new Date(a.occurred_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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