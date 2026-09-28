"use server";

import { randomInt } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/utils/auth";
import { RESET_CODE_LENGTH, RESET_CODE_TTL_MINUTES, isValidPassword } from "@/lib/validation";
import { hashResetCode } from "@/lib/reset-code";

export type AdminResetState = { error?: string; ok?: boolean } | undefined;

export type GenerateResetCodeState =
  | { error?: string; ok?: boolean; code?: string; email?: string; expiresAt?: string }
  | undefined;

export async function adminResetPassword(
  _prev: AdminResetState,
  formData: FormData
): Promise<AdminResetState> {
  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || !password) {
    return { error: "กรุณากรอกรหัสผ่านใหม่" };
  }
  if (!isValidPassword(password)) {
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

  // ตั้งรหัสใหม่แล้วโค้ดที่ออกไว้ก่อนหน้าถือว่าใช้ไม่ได้อีก
  await admin
    .from("password_reset_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);

  return { ok: true };
}

/** ออกตัวเลขสุ่ม n หลัก (0-9) แบบ uniform ไม่ใช้ Math.random */
function randomDigits(length: number): string {
  return randomInt(0, 10 ** length).toString().padStart(length, "0");
}

/**
 * ออกโค้ดรีเซ็ตรหัสผ่านให้ผู้ใช้ โดยไม่ต้องส่งอีเมล
 *
 * ผู้ใช้นำโค้ดนี้ไปกรอกที่หน้า login (อีเมล + โค้ด + รหัสใหม่)
 * โค้ดใช้ได้ครั้งเดียว หมดอายุใน RESET_CODE_TTL_MINUTES นาที
 */
export async function generateResetCodeAction(
  _prev: GenerateResetCodeState,
  formData: FormData
): Promise<GenerateResetCodeState> {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) {
    return { error: "ไม่พบผู้ใช้งาน" };
  }

  const adminUser = await requireAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "ยังไม่ได้ตั้งค่าคีย์ admin สำหรับฟีเจอร์นี้ (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  const email = userData?.user?.email?.toLowerCase();
  if (userError || !email) {
    return { error: "ไม่พบอีเมลของผู้ใช้งานนี้" };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + RESET_CODE_TTL_MINUTES * 60_000
  ).toISOString();

  // โค้ดมี unique constraint ถ้าชนกัน (แทบไม่เกิด) ให้ลองสุ่มใหม่สัก 5 ครั้ง
  // เก็บลง DB เป็น hash ส่วนโค้ดจริงคืนให้ Admin ไปบอกผู้ใช้ทางเดียว
  let code: string | null = null;
  for (let attempt = 0; attempt < 5 && code === null; attempt++) {
    const candidate = randomDigits(RESET_CODE_LENGTH);
    const { error } = await admin.from("password_reset_codes").insert({
      user_id: userId,
      email,
      code_hash: hashResetCode(candidate),
      expires_at: expiresAt,
      created_by: adminUser.id,
    });
    if (!error) {
      code = candidate;
    } else if (error.code !== "23505") {
      return { error: `ออกโค้ดไม่สำเร็จ: ${error.message}` };
    }
  }

  if (code === null) {
    return { error: "ออกโค้ดไม่สำเร็จ กรุณาลองใหม่" };
  }

  // โค้ดเก่าของผู้ใช้คนเดียวกันใช้ไม่ได้อีก (ใช้แค่โค้ดล่าสุด)
  await admin
    .from("password_reset_codes")
    .update({ used_at: now.toISOString() })
    .eq("user_id", userId)
    .is("used_at", null)
    .neq("code_hash", hashResetCode(code));

  return { ok: true, code, email, expiresAt };
}
