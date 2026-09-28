import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { listUserEmails } from "@/utils/supabase/admin";
import type { Profile } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RoleSelect } from "./role-select";
import { ResetPasswordButton } from "./reset-password-button";
import { ResetCodeButton } from "./reset-code-button";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB");
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles, error }, emails] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    listUserEmails(),
  ]);


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
        icon="users"
        title="ผู้ใช้งาน (Users)"
        description="กำหนด Role และรีเซ็ตรหัสผ่านให้ผู้ใช้งาน (เฉพาะ Admin)"
      />

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        วิธีรีเซ็ตรหัสผ่านที่ไม่ต้องส่งอีเมล: กด{" "}
        <span className="font-medium text-accent">ออกโค้ดรีเซ็ต</span>{" "}
        แล้วส่งโค้ด 6 หลักให้ผู้ใช้ไปกรอกที่หน้าเข้าสู่ระบบใต้ปุ่ม
        &quot;ลืมรหัสผ่าน?&quot; โค้ดใช้ได้ครั้งเดียวและหมดอายุใน 15 นาที
      </p>

      <div className="surface animate-rise overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">รีเซ็ตรหัสผ่าน</th>
                <th className="px-4 py-3">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5">
                    <EmptyState icon="users" title="ไม่พบผู้ใช้งาน" hint="ผู้ใช้ที่สมัครผ่านระบบจะแสดงที่นี่" />
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.full_name ?? "-"}
                      {p.role === "admin" && (
                        <span className="ml-2 rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {emails[p.id] ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelect userId={p.id} role={p.role} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-2">
                        <ResetCodeButton userId={p.id} />
                        <ResetPasswordButton userId={p.id} />
                      </div>
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