import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { type Alarm, type Machine, type Maintenance } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/machines"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← กลับหน้ารายการเครื่องจักร
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ประวัติเครื่องจักร: {current.machine_name}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {current.machine_id} · {current.machine_type} · {current.location}
          </p>
        </div>
        <StatusBadge status={current.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Alarm ทั้งหมด</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{alarms.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Alarm ที่ยังไม่ปิด</p>
          <p className="mt-1 text-3xl font-bold text-red-600">
            {alarms.filter((a) => a.status !== "Closed").length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">งานซ่อมบำรุงทั้งหมด</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{maintenance.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
          รายการ Alarm
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Alarm Code</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">สาเหตุ</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {alarms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                    ยังไม่มีรายการ Alarm ของเครื่องนี้
                  </td>
                </tr>
              ) : (
                alarms.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
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
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
          งานบำรุงรักษา
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ปัญหา / การแก้ไข</th>
                <th className="px-4 py-3">ช่างผู้ซ่อม</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                    ยังไม่มีงานบำรุงรักษาของเครื่องนี้
                  </td>
                </tr>
              ) : (
                maintenance.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
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
      </div>
    </div>
  );
}