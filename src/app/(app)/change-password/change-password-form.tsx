"use client";

import { useActionState } from "react";
import Link from "next/link";
import { changePasswordAction } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <div className="surface animate-rise p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl shadow-sm shadow-blue-600/20">
          🔑
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            เปลี่ยนรหัสผ่าน
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            กรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน
          </p>
        </div>
      </div>

      <form action={action} className="space-y-4">
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
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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