"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { hashResetCode } from "@/lib/reset-code";
import {
  RESET_CODE_MAX_ATTEMPTS,
  isValidEmail,
  isValidPassword,
  isValidResetCode,
  timingSafeEqual,
} from "@/lib/validation";

export type LoginState = { error?: string; ok?: boolean } | undefined;

// ข้อความเดียวสำหรับทุกกรณีที่รีเซ็ตไม่ได้ เพื่อไม่ให้บอกว่าอีเมลนี้มีอยู่จริงหรือไม่
const RESET_FAILED =
  "อีเมลหรือโค้ดไม่ถูกต้อง โค้ดอาจหมดอายุ ถูกใช้ไปแล้ว หรือถูกล็อกจากการกรอกผิดเกินกำหนด";

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่านให้ครบ" };
  }
  if (!isValidEmail(email)) {
    return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  redirect("/dashboard");
}

export async function signupAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่านให้ครบ" };
  }
  if (!isValidEmail(email)) {
    return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  }
  if (!isValidPassword(password)) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  // ปิดการสมัครสมาชิกสาธารณะได้ด้วย ALLOW_PUBLIC_SIGNUP=false
  // ค่าเริ่มต้นคือ "เปิด" เพื่อให้ผู้ประเมินสมัครบัญชีทดสอบได้
  if (process.env.ALLOW_PUBLIC_SIGNUP === "false") {
    return { error: "ระบบปิดการสมัครสมาชิกใหม่ไว้ กรุณาให้ผู้ดูแลสร้างบัญชีให้คุณ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || email.split("@")[0] },
    },
  });

  if (error) {
    return { error: error.message === "User already registered"
      ? "อีเมลนี้ถูกใช้งานแล้ว"
      : error.message };
  }

  return { error: "" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * รีเซ็ตรหัสผ่านโดยไม่ต้องส่งลิงก์ไปอีเมล
 *
 * ผู้ใช้กรอก อีเมล + โค้ด 6 หลัก + รหัสใหม่ โดยโค้ดนั้นต้องถูกออกโหมด Admin
 * จากหน้า /admin/users มาก่อน (ดู supabase/reset_codes.sql)
 *
 * กันการเดาโค้ด: นับจำนวนครั้งที่กรอกผิด เมื่อครบจะเผาโค้ดทิ้งทันที
 * และข้อความ error เป็นข้อความเดียวกันทุกกรณี เพื่อไม่ให้เปิดเผยว่าอีเมลมีอยู่จริง
 */
export async function requestPasswordResetAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !code || !password) {
    return { error: "กรุณากรอกอีเมล โค้ด และรหัสผ่านใหม่ให้ครบ" };
  }
  if (!isValidEmail(email)) {
    return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  }
  if (!isValidResetCode(code)) {
    return { error: "โค้ดต้องเป็นตัวเลข 6 หลัก" };
  }
  if (!isValidPassword(password)) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "ยังไม่ได้ตั้งค่าคีย์ admin สำหรับฟีเจอร์นี้ (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const submittedHash = hashResetCode(code);

  // เอาเฉพาะโค้ดของอีเมลนี้ที่ยังไม่ถูกใช้และยังไม่หมดอายุ
  const { data: candidates, error: lookupError } = await admin
    .from("password_reset_codes")
    .select("id, user_id, code_hash, attempts")
    .eq("email", email)
    .is("used_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(5);

  if (lookupError) {
    return { error: "รีเซ็ตไม่สำเร็จ กรุณาลองใหม่ภายหลัง" };
  }

  const rows = candidates ?? [];
  if (rows.length === 0) {
    return { error: RESET_FAILED };
  }

  const match = rows.find((row) => timingSafeEqual(row.code_hash, submittedHash));

  if (!match) {
    // กรอกผิด — นับครั้งล่าสุดไว้บนโค้ดใหม่สุด ครบ 5 ครั้งก็เผาโค้ดทิ้ง
    const newest = rows[0];
    const attempts = newest.attempts + 1;
    await admin
      .from("password_reset_codes")
      .update(
        attempts >= RESET_CODE_MAX_ATTEMPTS
          ? { attempts, used_at: now }
          : { attempts }
      )
      .eq("id", newest.id);

    return { error: RESET_FAILED };
  }

  if (match.attempts >= RESET_CODE_MAX_ATTEMPTS) {
    await admin
      .from("password_reset_codes")
      .update({ used_at: now })
      .eq("id", match.id);
    return { error: RESET_FAILED };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    match.user_id,
    { password }
  );
  if (updateError) {
    return { error: "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่ภายหลัง" };
  }

  // ใช้โค้ดนี้ทิ้ง และล้างโค้ดตัวอื่นของอีเมลเดียวกันทิ้งทั้งหมด
  await admin
    .from("password_reset_codes")
    .update({ used_at: now })
    .eq("email", email)
    .is("used_at", null);

  return { ok: true };
}

export async function changePasswordAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const current = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!current || !password) {
    return { error: "กรุณากรอกให้ครบทั้ง 2 ช่อง" };
  }
  if (!isValidPassword(password)) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน" };
  }

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (signInErr) {
    return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่ภายหลัง" };
  }

  return { ok: true };
}