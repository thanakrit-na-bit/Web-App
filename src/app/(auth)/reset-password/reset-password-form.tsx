"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, undefined);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          ตั้งรหัสผ่านใหม่
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ
        </p>
      </div>

      <form action={action} className="space-y-4">
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
            เปลี่ยนรหัสผ่านสำเร็จ — เข้าสู่ระบบได้เลย
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← กลับไปเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}