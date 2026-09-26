import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import type { AuditLog } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

function formatDateTime(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

function actionColor(action: string) {
  if (action === "INSERT") {
    return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  }
  if (action === "UPDATE") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  }
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

export default async function AdminAuditPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <p className="text-sm text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
      </p>
    );
  }

  const rows = (data ?? []) as AuditLog[];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="📜"
        title="Audit Log"
        description="บันทึกการเพิ่ม / แก้ไข / ลบ ข้อมูลทั้งหมดในระบบ (แสดง 200 รายการล่าสุด)"
      />

      <div className="surface animate-rise overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 text-xs uppercase tracking-wide text-zinc-500 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">ผู้ใช้งาน</th>
                <th className="px-4 py-3">การกระทำ</th>
                <th className="px-4 py-3">ตารางข้อมูล</th>
                <th className="px-4 py-3">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5">
                    <EmptyState
                      icon="📜"
                      title="ยังไม่มีรายการ Audit Log"
                      hint="ทุกการเพิ่ม / แก้ไข / ลบ ข้อมูลจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ"
                    />
                  </td>
                </tr>
              ) : (
                rows.map((log) => (
                  <tr key={log.id} className="align-top transition-colors hover:bg-blue-50/40 dark:hover:bg-zinc-900/60">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {log.user_email ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {log.target_type}
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <p
                        className="line-clamp-3 overflow-hidden text-xs text-zinc-500 dark:text-zinc-400"
                        title={log.details ?? ""}
                      >
                        {log.details ?? "-"}
                      </p>
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