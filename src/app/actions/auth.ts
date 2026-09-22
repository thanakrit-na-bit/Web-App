"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type LoginState = { error?: string; ok?: boolean } | undefined;

async function siteUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่านให้ครบ" };
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
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
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

export async function requestPasswordResetAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "กรุณากรอกอีเมล" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/reset-password`,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate") || msg.includes("security") || msg.includes("60 second") || msg.includes("too many")) {
      return { error: "ขอลิงก์บ่อยเกินไป กรุณารอประมาณ 1 นาที แล้วลองอีกครั้ง" };
    }
    return { error: "อีเมลนี้ไม่ตรงกับบัญชีในระบบ ตรวจสอบตัวสะกด (ตัวเล็ก-ตัวใหญ่) แล้วลองใหม่" };
  }

  return { ok: true };
}

export async function updatePasswordAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "ลิงก์หมดอายุหรือหมดสิทธิ์ กรุณาขอลิงก์รีเซ็ตใหม่อีกครั้ง" };
  }

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
  if (password.length < 6) {
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