import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { StatusBadge } from "@/components/status-badge";
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
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  chip: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${chip}`}
        >
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getStats();
  const supabase = await createClient();

  const [recentAlarmsRes, upcomingMaintenanceRes] = await Promise.all([
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
  ]);

  const recentAlarms = (recentAlarmsRes.data ?? []) as Alarm[];
  const upcomingMaintenance = (upcomingMaintenanceRes.data ?? []) as Maintenance[];

  if (!stats) {
    return <p className="text-sm text-red-600">ไม่สามารถโหลดข้อมูลได้</p>;
  }

  const machineStatusBar = [
    { label: "Running", value: stats.running, color: "bg-green-500" },
    { label: "Stop", value: stats.stop, color: "bg-yellow-500" },
    { label: "Alarm", value: stats.machineAlarm, color: "bg-red-500" },
    { label: "Maintenance", value: stats.machineMaintenance, color: "bg-blue-500" },
  ];
  const machineTotal = Math.max(stats.machines, 1);

  const alarmStatusBar = [
    { label: "Open", value: stats.openAlarms, color: "bg-red-500" },
    { label: "In Progress", value: stats.inProgressAlarms, color: "bg-yellow-500" },
    { label: "Closed", value: stats.closedAlarms, color: "bg-green-500" },
  ];
  const alarmTotal = Math.max(stats.alarms, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl shadow-sm">
          👋
        </span>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ยินดีต้อนรับ {user.full_name ?? user.email} กลับมา
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="เครื่องจักรทั้งหมด"
          value={stats.machines}
          color="text-zinc-900 dark:text-zinc-100"
          icon="🏭"
          chip="bg-zinc-100 dark:bg-zinc-800"
        />
        <StatCard
          label="เครื่องจักรแจ้ง Alarm"
          value={stats.machineAlarm}
          color="text-red-600 dark:text-red-400"
          icon="🚨"
          chip="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
        />
        <StatCard
          label="รายการ Alarm ทั้งหมด"
          value={stats.alarms}
          color="text-orange-600 dark:text-orange-400"
          icon="⚠️"
          chip="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
        />
        <StatCard
          label="งานบำรุงรักษา"
          value={stats.maintenance}
          color="text-blue-600 dark:text-blue-400"
          icon="🔧"
          chip="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-sm dark:bg-zinc-800">
              📦
            </span>
            สถานะเครื่องจักร (Machine Status)
          </h3>
          <div className="space-y-4">
            {machineStatusBar.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {s.label} ({s.value})
                  </span>
                  <span>{Math.round((s.value / machineTotal) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${(s.value / machineTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-sm dark:bg-zinc-800">
              ⏱️
            </span>
            สถานะ Alarm
          </h3>
          <div className="space-y-4">
            {alarmStatusBar.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {s.label} ({s.value})
                  </span>
                  <span>{Math.round((s.value / alarmTotal) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${(s.value / alarmTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-sm dark:bg-red-900/40">
                🚨
              </span>
              Alarm ที่ยังเปิดอยู่
            </h3>
            <Link
              href="/alarms"
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          {recentAlarms.length === 0 ? (
            <p className="text-sm text-zinc-400">ไม่มี Alarm ค้างอยู่ 🎉</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentAlarms.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2">
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
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-sm dark:bg-blue-900/40">
                🔧
              </span>
              งานซ่อมที่ถึงกำหนด
            </h3>
            <Link
              href="/maintenance"
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          {upcomingMaintenance.length === 0 ? (
            <p className="text-sm text-zinc-400">ไม่มีงานซ่อมค้างอยู่</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {upcomingMaintenance.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2">
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
        </div>
      </div>
    </div>
  );
}