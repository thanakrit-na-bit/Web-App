"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdminResetState = { error?: string; ok?: boolean } | undefined;

export async function adminResetPassword(
  _prev: AdminResetState,
  formData: FormData
): Promise<AdminResetState> {
  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || !password) {
    return { error: "กรุณากรอกรหัสผ่านใหม่" };
  }
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "กรุณาเข้าสู่ระบบก่อน" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { error: "สิทธิ์เฉพาะ Admin เท่านั้น" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "ยังไม่ได้ตั้งค่าคีย์ admin สำหรับฟีเจอร์นี้ (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    return { error: `รีเซ็ตไม่สำเร็จ: ${error.message}` };
  }

  return { ok: true };
}