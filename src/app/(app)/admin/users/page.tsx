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

  const [{ data: profiles, error }, { emails, hasServiceRole }] = await Promise.all([
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

  // บัญชีใน auth.users ที่ไม่มีแถวใน profiles จะไม่โผล่ในตารางนี้เลย
  // เช็คจากรายการอีเมลที่โหลดได้ เพื่อบอกผู้ดูแลว่ามีบัญชีหลุดหรือเปล่า
  const orphanCount = hasServiceRole
    ? Object.keys(emails).filter((id) => !rows.some((p) => p.id === id)).length
    : 0;
  const missingEmail = hasServiceRole ? rows.filter((p) => !emails[p.id]).length : 0;


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

      {!hasServiceRole && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          ยังไม่ได้ตั้งค่า <code>SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          คอลัมน์อีเมลจึงแสดงเป็น &quot;-&quot; และฟีเจอร์ออกโค้ดรีเซ็ตจะใช้ไม่ได้
          ตั้งค่าใน Vercel → Settings → Environment Variables แล้ว redeploy
        </p>
      )}

      {hasServiceRole && orphanCount > 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          พบ <strong>{orphanCount}</strong> บัญชีในระบบ Auth ที่ไม่มีแถวในตาราง{" "}
          <code>profiles</code> จึงไม่ปรากฏในตารางนี้ — รัน{" "}
          <code>supabase/fix_missing_profiles.sql</code> ใน Supabase SQL Editor
          เพื่อกู้คืน แล้วรีเฟรชหน้านี้
        </p>
      )}

      {hasServiceRole && missingEmail > 0 && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          มี <strong>{missingEmail}</strong> แถวใน <code>profiles</code>{" "}
          ที่ไม่พบบัญชีในระบบ Auth (แถวที่แสดงเป็น &quot;-&quot;) — บัญชีเหล่านี้เข้าสู่ระบบไม่ได้
        </p>
      )}

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
                      {emails[p.id] ?? (
                        <span className="text-amber-600 dark:text-amber-400">
                          - ไม่พบบัญชี
                        </span>
                      )}
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