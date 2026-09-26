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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {status === "checking" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">กำลังตรวจสอบลิงก์...</p>
      )}

      {status === "ready" && <ResetPasswordForm />}

      {status === "empty" && (
        <div className="panel w-full max-w-sm p-7 text-center">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            ไม่พบข้อมูลการรีเซ็ตในหน้านี้ กรุณาเปิดลิงก์ที่ส่งไปในอีเมลอีกครั้ง
            (ลิงก์จะมีผลเพียงครั้งเดียว)
          </p>
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            กลับไปเข้าสู่ระบบ
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="panel w-full max-w-sm p-7 text-center">
          <p className="mb-4 text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            ไปหน้าเข้าสู่ระบบเพื่อขอลิงก์ใหม่
          </Link>
        </div>
      )}
    </main>
  );
}