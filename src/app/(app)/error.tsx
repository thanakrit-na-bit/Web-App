"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";

/**
 * จับ error ที่เกิดขึ้นในหน้าใด ๆ ของส่วนที่ล็อกอินแล้ว
 * เพื่อไม่ให้ผู้ใช้เจอหน้า error ดิบของ Next.js กลางงาน
 *
 * Next.js 16: ใช้ prop `retry` (stable ตั้งแต่ 16.3) ไม่ใช่ `reset`
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // ใน production ข้อความ error จะถูกซ่อนไว้ ใช้ digest ไปเทียบกับ log ฝั่ง server
    console.error("App error:", error.message, "digest:", error.digest);
  }, [error]);

  return (
    <div className="surface animate-rise flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400">
        <Icon name="alert" className="h-6 w-6" />
      </span>

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          เกิดข้อผิดพลาดในการแสดงผลหน้านี้
        </h2>
        <p className="mx-auto max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          ข้อมูลของคุณไม่ได้หายไป กดลองใหม่อีกครั้ง หรือกลับไปหน้าแดชบอร์ด
          ถ้ายังพังอยู่ แจ้งรหัสอ้างอิงด้านล่างให้ผู้ดูแลระบบได้
        </p>
      </div>

      {error.digest ? (
        <p className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
          รหัสอ้างอิง: {error.digest}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => retry()} className="btn btn-primary">
          ลองใหม่
        </button>
        <Link href="/dashboard" className="btn btn-ghost">
          กลับหน้าแดชบอร์ด
        </Link>
      </div>
    </div>
  );
}
