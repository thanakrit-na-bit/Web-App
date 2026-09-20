import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { ALARM_STATUSES, type Alarm, type Machine } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { ExportCsvButton } from "@/components/export-csv-button";
import { AlarmForm } from "./alarm-form";
import { AlarmRowActions } from "./alarm-row-actions";

const selectClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AlarmsPage(props: PageProps<"/alarms">) {
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
    .from("alarms")
    .select("*, machines(machine_id, machine_name)")
    .order("occurred_at", { ascending: false });

  const search =
    typeof params.q === "string" && params.q.trim() ? params.q.trim() : null;
  const status =
    typeof params.status === "string" && ALARM_STATUSES.includes(params.status as never)
      ? params.status
      : null;
  const machineId =
    typeof params.machine === "string" && params.machine ? params.machine : null;
  const from = typeof params.from === "string" && params.from ? params.from : null;
  const to = typeof params.to === "string" && params.to ? params.to : null;

  if (search) {
    query.or(
      `alarm_code.ilike.%${search}%,alarm_description.ilike.%${search}%,cause.ilike.%${search}%`
    );
  }
  if (status) query.eq("status", status);
  if (machineId) query.eq("machine_id", machineId);
  if (from) query.gte("occurred_at", `${from}T00:00:00`);
  if (to) query.lte("occurred_at", `${to}T23:59:59`);

  const { data: alarms, error } = await query;

  if (error) {
    return (
      <p className="text-sm text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
      </p>
    );
  }

  const rows = (alarms ?? []) as Alarm[];
  const hasFilter = !!(search || status || machineId || from || to);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">รายการ Alarm</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            บันทึกและติดตามสถานะ Alarm ของเครื่องจักร
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            kind="alarms"
            filters={{
              q: search ?? undefined,
              status: status ?? undefined,
              machine: machineId ?? undefined,
              from: from ?? undefined,
              to: to ?? undefined,
            }}
          />
          {canEdit && <AlarmForm machines={machineList} />}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">ค้นหา</span>
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="Alarm Code / รายละเอียด / สาเหตุ..."
            className={`${inputClass} w-64`}
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
            {ALARM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          ค้นหา
        </button>
        {hasFilter ? (
          <Link
            href="/alarms"
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
                <th className="px-4 py-3">Alarm Code</th>
                <th className="px-4 py-3">เครื่องจักร</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">สาเหตุ</th>
                <th className="px-4 py-3">สถานะ</th>
                {canEdit && <th className="px-4 py-3">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-zinc-400">
                    ไม่พบรายการ Alarm
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="align-top hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{a.alarm_code}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {a.machines?.machine_id}
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                        {a.machines?.machine_name}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600 dark:text-zinc-400">{a.alarm_description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(a.occurred_at)}
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-zinc-500 dark:text-zinc-400">{a.cause ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <AlarmForm machines={machineList} alarm={a} />
                          <AlarmRowActions alarmId={a.id} />
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