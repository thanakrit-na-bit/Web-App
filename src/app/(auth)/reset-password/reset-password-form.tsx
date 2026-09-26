"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/app/actions/auth";
import { Icon } from "@/components/icon";

const inputClass = "field";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, undefined);

  return (
    <div className="panel w-full max-w-sm p-7">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
          <Icon name="key" className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/60 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state && !state.error && state.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/60 dark:text-green-300">
            เปลี่ยนรหัสผ่านสำเร็จ — เข้าสู่ระบบได้เลย
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-2.5"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          กลับไปเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}