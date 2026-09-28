import Link from "next/link";
import { Icon } from "@/components/icon";

/**
 * หน้า 404 ของทั้งเว็บ (รวม URL ที่ไม่มีอยู่ เช่น /reset-password ที่ถูกลบไปแล้ว)
 * เป็น server component จึงไม่ต้องมี "use client"
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-sunken text-zinc-400">
        <Icon name="search" className="h-6 w-6" />
      </span>

      <div className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          404
        </p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          ไม่พบหน้าที่คุณเปิด
        </h1>
        <p className="mx-auto max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          ลิงก์นี้อาจถูกย้าย เปลี่ยนชื่อ หรือไม่มีอยู่ในระบบ
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/dashboard" className="btn btn-primary">
          ไปหน้าแดชบอร์ด
        </Link>
        <Link href="/login" className="btn btn-ghost">
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
