"use client";

import { useState } from "react";
import { useActionState } from "react";
import { adminResetPassword } from "@/app/actions/admin";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(adminResetPassword, undefined);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        {open ? "ยกเลิก" : "รีเซ็ตรหัส"}
      </button>
      {open && (
        <form action={action} className="mt-1 flex items-center gap-2">
          <input type="hidden" name="user_id" value={userId} />
          <input
            type="password"
            name="password"
            placeholder="รหัสใหม่ (ขั้นต่ำ 6)"
            minLength={6}
            required
            className="w-44 rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "..." : "ตั้งรหัส"}
          </button>
        </form>
      )}
      {state?.error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state && !state.error && state.ok && (
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          ตั้งรหัสใหม่สำเร็จแล้ว
        </p>
      )}
    </div>
  );
}