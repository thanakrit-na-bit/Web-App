"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResetPasswordForm } from "./reset-password-form";

type Status = "checking" | "ready" | "empty" | "error";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } catch {
          if (!cancelled) {
            setErrorMessage(
              "ลิงก์นี้หมดอายุหรือใช้ไปแล้ว กรุณาขอลิงก์รีเซ็ตใหม่จากหน้าเข้าสู่ระบบ"
            );
            setStatus("error");
            return;
          }
        }
        window.history.replaceState({}, "", "/reset-password");
      }

      const { data } = await supabase.auth.getSession();

      if (cancelled) return;
      if (data.session) {
        setStatus("ready");
      } else {
        setStatus("empty");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 px-4 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl dark:bg-indigo-900/20" />
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {status === "checking" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">กำลังตรวจสอบลิงก์...</p>
      )}

      {status === "ready" && <ResetPasswordForm />}

      {status === "empty" && (
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            ไม่พบข้อมูลการรีเซ็ตในหน้านี้ กรุณาเปิดลิงก์ที่ส่งไปในอีเมลอีกครั้ง
            (ลิงก์จะมีผลเพียงครั้งเดียว)
          </p>
          <Link
            href="/login"
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            ← กลับไปเข้าสู่ระบบ
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-zinc-950">
          <p className="mb-4 text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
          <Link
            href="/login"
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            ← ไปหน้าเข้าสู่ระบบเพื่อขอลิงก์ใหม่
          </Link>
        </div>
      )}
    </main>
  );
}