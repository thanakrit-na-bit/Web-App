"use client";

import { useActionState } from "react";
import Link from "next/link";
import { changePasswordAction } from "@/app/actions/auth";
import { Icon } from "@/components/icon";

const inputClass =
  "field";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <div className="surface animate-rise p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-accent-soft text-accent">
          <Icon name="key" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/60 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state && !state.error && state.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/60 dark:text-green-300">
            เปลี่ยนรหัสผ่านสำเร็จ — ใช้รหัสใหม่ได้เลย
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-2.5"
        >
          {pending ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← กลับไป Dashboard
        </Link>
      </div>
    </div>
  );
}