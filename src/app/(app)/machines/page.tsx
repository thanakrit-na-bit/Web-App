import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { MACHINE_STATUSES, type Machine } from "@/lib/types";
import { can } from "@/lib/permissions";
import { StatusBadge } from "@/components/status-badge";
import { ExportCsvButton } from "@/components/export-csv-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
import { MachineForm } from "./machine-form";
import { MachineRowActions } from "./machine-row-actions";

const selectClass = "field w-auto";
const inputClass = "field";

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

  const isAdmin = can(user.role, "manageMachines");
  const rows = (machines ?? []) as Machine[];
  const colCount = 6 + (isAdmin ? 1 : 0);

  return (
    <div className="space-y-5">
      <PageHeader
        icon="machine"
        title="เครื่องจักร (Machines)"
        description="จัดการข้อมูลเครื่องจักรทั้งหมดในโรงงาน"
        actions={
          <>
            <ExportCsvButton kind="machines" filters={{ q: search ?? undefined, status: statusFilter ?? undefined }} />
            {isAdmin && <MachineForm />}
          </>
        }
      />

      <form className="surface no-print flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-56 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="ค้นหา ID / ชื่อ / ประเภท / ตำแหน่ง..."
            className={`${inputClass} pl-9`}
          />
        </div>
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
          className="btn btn-primary"
        >
          ค้นหา
        </button>
        {search || statusFilter ? (
          <Link
            href="/machines"
            className="btn btn-ghost"
          >
            ล้างตัวกรอง
          </Link>
        ) : null}
      </form>

      <div className="surface animate-rise overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-line bg-sunken text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Machine ID</th>
                <th className="px-4 py-3">ชื่อเครื่องจักร</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">ตำแหน่ง</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ประวัติ</th>
                {isAdmin && <th className="px-4 py-3">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="p-5">
                    <EmptyState
                      icon="search"
                      title="ไม่พบข้อมูลเครื่องจักร"
                      hint="ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง แล้วค้นหาอีกครั้ง"
                    />
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr
                    key={m.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{m.machine_id}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{m.machine_name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{m.machine_type}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{m.location}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/machines/${m.id}`}
                        className="inline-flex items-center gap-0.5 text-sm font-medium text-accent hover:underline"
                      >
                        ดูประวัติ
                        <Icon name="chevron-right" className="h-3.5 w-3.5" />
                      </Link>
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
        {rows.length > 0 ? (
          <p className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-400 dark:border-zinc-800">
            แสดง {rows.length} เครื่องจักร
          </p>
        ) : null}
      </div>
    </div>
  );
}