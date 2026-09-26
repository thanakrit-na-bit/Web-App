import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import type { Profile } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RoleSelect } from "./role-select";
import { ResetPasswordButton } from "./reset-password-button";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB");
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="text-sm text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
      </p>
    );
  }

  const rows = (profiles ?? []) as Profile[];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="👥"
        title="ผู้ใช้งาน (Users)"
        description="กำหนด Role ให้กับผู้ใช้งาน (เฉพาะ Admin)"
      />

      <div className="surface animate-rise overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 text-xs uppercase tracking-wide text-zinc-500 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">รีเซ็ตรหัสผ่าน</th>
                <th className="px-4 py-3">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-5">
                    <EmptyState icon="👥" title="ไม่พบผู้ใช้งาน" hint="ผู้ใช้ที่สมัครผ่านระบบจะแสดงที่นี่" />
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-zinc-900/60">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.full_name ?? "-"}
                      {p.role === "admin" && (
                        <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelect userId={p.id} role={p.role} />
                    </td>
                    <td className="px-4 py-3">
                      <ResetPasswordButton userId={p.id} />
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(p.created_at)}
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