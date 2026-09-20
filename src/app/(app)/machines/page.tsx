import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { MACHINE_STATUSES, type Machine } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { MachineForm } from "./machine-form";
import { MachineRowActions } from "./machine-row-actions";

const selectClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500";
const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500";

export default async function MachinesPage(props: PageProps<"/machines">) {
  const { q, status } = await props.searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const query = supabase
    .from("machines")
    .select("*")
    .order("machine_id", { ascending: true });

  const search = typeof q === "string" && q.trim() ? q.trim() : null;
  const statusFilter =
    typeof status === "string" && MACHINE_STATUSES.includes(status as never)
      ? status
      : null;

  if (search) {
    query.or(
      `machine_id.ilike.%${search}%,machine_name.ilike.%${search}%,machine_type.ilike.%${search}%,location.ilike.%${search}%`
    );
  }
  if (statusFilter) {
    query.eq("status", statusFilter);
  }

  const { data: machines, error } = await query;

  if (error) {
    return (
      <p className="text-sm text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
      </p>
    );
  }

  const isAdmin = user.role === "admin";
  const rows = (machines ?? []) as Machine[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">เครื่องจักร (Machines)</h2>
          <p className="text-sm text-zinc-500">
            จัดการข้อมูลเครื่องจักรทั้งหมดในโรงงาน
          </p>
        </div>
        {isAdmin && <MachineForm />}
      </div>

      <form className="flex flex-wrap gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="ค้นหา ID / ชื่อ / ประเภท / ตำแหน่ง..."
          className={`${inputClass} w-72`}
        />
        <select name="status" defaultValue={statusFilter ?? ""} className={selectClass}>
          <option value="">ทุกสถานะ</option>
          {MACHINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ค้นหา
        </button>
        {search || statusFilter ? (
          <Link
            href="/machines"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            ล้างตัวกรอง
          </Link>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Machine ID</th>
                <th className="px-4 py-3">ชื่อเครื่องจักร</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ตำแหน่ง</th>
                <th className="px-4 py-3">สถานะ</th>
                {isAdmin && <th className="px-4 py-3">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-zinc-400">
                    ไม่พบข้อมูลเครื่องจักร
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">{m.machine_id}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{m.machine_name}</td>
                    <td className="px-4 py-3 text-zinc-600">{m.machine_type}</td>
                    <td className="px-4 py-3 text-zinc-600">{m.location}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MachineForm machine={m} />
                          <MachineRowActions machineId={m.id} />
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