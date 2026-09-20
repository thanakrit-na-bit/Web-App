import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";

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
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getStats();

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
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Dashboard</h2>
        <p className="text-sm text-zinc-500">
          ยินดีต้อนรับ {user.full_name ?? user.email}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="เครื่องจักรทั้งหมด" value={stats.machines} color="text-zinc-900" />
        <StatCard label="เครื่องจักรแจ้ง Alarm" value={stats.machineAlarm} color="text-red-600" />
        <StatCard label="รายการ Alarm ทั้งหมด" value={stats.alarms} color="text-orange-600" />
        <StatCard label="งานบำรุงรักษา" value={stats.maintenance} color="text-blue-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">
            สถานะเครื่องจักร (Machine Status)
          </h3>
          <div className="space-y-4">
            {machineStatusBar.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs text-zinc-500">
                  <span>
                    {s.label} ({s.value})
                  </span>
                  <span>{Math.round((s.value / machineTotal) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${(s.value / machineTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">สถานะ Alarm</h3>
          <div className="space-y-4">
            {alarmStatusBar.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs text-zinc-500">
                  <span>
                    {s.label} ({s.value})
                  </span>
                  <span>{Math.round((s.value / alarmTotal) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
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
    </div>
  );
}