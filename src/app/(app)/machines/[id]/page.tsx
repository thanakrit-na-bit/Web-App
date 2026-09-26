import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { type Alarm, type Machine, type Maintenance } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default async function MachineHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data: machine } = await supabase
    .from("machines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!machine) notFound();

  const current = machine as Machine;

  const [alarmsRes, maintenanceRes] = await Promise.all([
    supabase
      .from("alarms")
      .select("*, machines(machine_id, machine_name)")
      .eq("machine_id", id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("maintenance_records")
      .select("*, machines(machine_id, machine_name)")
      .eq("machine_id", id)
      .order("maintenance_date", { ascending: false }),
  ]);

  const alarms = (alarmsRes.data ?? []) as Alarm[];
  const maintenance = (maintenanceRes.data ?? []) as Maintenance[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/machines"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            <Icon name="chevron-right" className="h-3.5 w-3.5 rotate-180" />
            กลับหน้ารายการเครื่องจักร
          </Link>
          <h2 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {current.machine_name}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {current.machine_id} · {current.machine_type} · {current.location}
          </p>
        </div>
        <StatusBadge status={current.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface animate-rise p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Alarm ทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {alarms.length}
          </p>
        </div>
        <div className="surface animate-rise p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Alarm ที่ยังไม่ปิด</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {alarms.filter((a) => a.status !== "Closed").length}
          </p>
        </div>
        <div className="surface animate-rise p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">งานซ่อมบำรุงทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {maintenance.length}
          </p>
        </div>
      </div>

      <Card delay={120} padded={false}>
        <div className="border-b border-line px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          รายการ Alarm
        </div>
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-line bg-sunken text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Alarm Code</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">สาเหตุ</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {alarms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5">
                    <EmptyState
                      icon="alarm"
                      title="ยังไม่มีรายการ Alarm ของเครื่องนี้"
                      hint="เมื่อมีการบันทึก Alarm ของเครื่องจักรนี้ ประวัติจะแสดงที่นี่"
                    />
                  </td>
                </tr>
              ) : (
                alarms.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/70">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{a.alarm_code}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{a.alarm_description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(a.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{a.cause ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card delay={180} padded={false}>
        <div className="border-b border-line px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          งานบำรุงรักษา
        </div>
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-line bg-sunken text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ปัญหา / การแก้ไข</th>
                <th className="px-4 py-3">ช่างผู้ซ่อม</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5">
                    <EmptyState
                      icon="wrench"
                      title="ยังไม่มีงานบำรุงรักษาของเครื่องนี้"
                      hint="เมื่อมีการบันทึกงานซ่อมของเครื่องจักรนี้ ประวัติจะแสดงที่นี่"
                    />
                  </td>
                </tr>
              ) : (
                maintenance.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/70">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {r.maintenance_date}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.maintenance_type}</td>
                    <td className="max-w-md px-4 py-3">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{r.problem}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{r.action_taken}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.technician ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}