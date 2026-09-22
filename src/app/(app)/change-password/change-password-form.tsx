"use client";

import { useActionState } from "react";
import Link from "next/link";
import { changePasswordAction } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">เปลี่ยนรหัสผ่าน</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        กรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน
      </p>

      <form action={action} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="current_password"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            รหัสผ่านปัจจุบัน
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            รหัสผ่านใหม่
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            className={inputClass}
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/40 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state && !state.error && state.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/40 dark:text-green-300">
            เปลี่ยนรหัสผ่านสำเร็จ — ใช้รหัสใหม่ได้เลย
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← กลับไป Dashboard
        </Link>
      </div>
    </div>
  );
}