import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import {
  MAINTENANCE_STATUSES,
  type Machine,
  type Maintenance,
} from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { ExportCsvButton } from "@/components/export-csv-button";
import { MaintenanceForm } from "./maintenance-form";
import { MaintenanceRowActions } from "./maintenance-row-actions";

const selectClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default async function MaintenancePage(props: PageProps<"/maintenance">) {
  const params = await props.searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const canEdit = user.role === "admin" || user.role === "technician";

  const { data: machines } = await supabase
    .from("machines")
    .select("id, machine_id, machine_name")
    .order("machine_id");
  const machineList = (machines ?? []) as Pick<Machine, "id" | "machine_id" | "machine_name">[];

  const query = supabase
    .from("maintenance_records")
    .select("*, machines(machine_id, machine_name)")
    .order("maintenance_date", { ascending: false });

  const search =
    typeof params.q === "string" && params.q.trim() ? params.q.trim() : null;
  const status =
    typeof params.status === "string" &&
    MAINTENANCE_STATUSES.includes(params.status as never)
      ? params.status
      : null;
  const machineId =
    typeof params.machine === "string" && params.machine ? params.machine : null;
  const technician =
    typeof params.technician === "string" && params.technician.trim()
      ? params.technician.trim()
      : null;
  const from = typeof params.from === "string" && params.from ? params.from : null;
  const to = typeof params.to === "string" && params.to ? params.to : null;

  if (search) {
    query.or(`problem.ilike.%${search}%,action_taken.ilike.%${search}%`);
  }
  if (status) query.eq("status", status);
  if (machineId) query.eq("machine_id", machineId);
  if (technician) query.ilike("technician", `%${technician}%`);
  if (from) query.gte("maintenance_date", from);
  if (to) query.lte("maintenance_date", to);

  const { data: records, error } = await query;

  if (error) {
    return (
      <p className="text-sm text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
      </p>
    );
  }

  const rows = (records ?? []) as Maintenance[];
  const hasFilter = !!(search || status || machineId || technician || from || to);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">งานบำรุงรักษา (Maintenance)</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            บันทึกงานซ่อมบำรุงของเครื่องจักรในโรงงาน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            kind="maintenance"
            filters={{
              q: search ?? undefined,
              status: status ?? undefined,
              machine: machineId ?? undefined,
              technician: technician ?? undefined,
              from: from ?? undefined,
              to: to ?? undefined,
            }}
          />
          {canEdit && <MaintenanceForm machines={machineList} />}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">ค้นหา</span>
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="ปัญหา / การแก้ไข..."
            className={`${inputClass} w-56`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">จากวันที่</span>
          <input name="from" type="date" defaultValue={from ?? ""} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">ถึงวันที่</span>
          <input name="to" type="date" defaultValue={to ?? ""} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">เครื่องจักร</span>
          <select name="machine" defaultValue={machineId ?? ""} className={selectClass}>
            <option value="">ทุกเครื่องจักร</option>
            {machineList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machine_id} - {m.machine_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">สถานะ</span>
          <select name="status" defaultValue={status ?? ""} className={selectClass}>
            <option value="">ทุกสถานะ</option>
            {MAINTENANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">ช่างผู้ซ่อม</span>
          <input
            name="technician"
            defaultValue={technician ?? ""}
            placeholder="ชื่อช่าง..."
            className={`${inputClass} w-36`}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          ค้นหา
        </button>
        {hasFilter ? (
          <Link
            href="/maintenance"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ล้างตัวกรอง
          </Link>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">เครื่องจักร</th>
                <th className="px-4 py-3">ประเภทงานซ่อม</th>
                <th className="px-4 py-3">ปัญหา / การแก้ไข</th>
                <th className="px-4 py-3">ช่างผู้ซ่อม</th>
                <th className="px-4 py-3">สถานะ</th>
                {canEdit && <th className="px-4 py-3">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-zinc-400">
                    ไม่พบงานบำรุงรักษา
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {r.maintenance_date}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {r.machines?.machine_id}
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                        {r.machines?.machine_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.maintenance_type}</td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{r.problem}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{r.action_taken}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.technician ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <MaintenanceForm machines={machineList} record={r} />
                          <MaintenanceRowActions recordId={r.id} />
                        </div>
                      </td>
                    )}
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