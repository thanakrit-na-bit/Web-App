"use client";

import { useActionState } from "react";
import { generateResetCodeAction } from "@/app/actions/admin";
import { formatTime } from "@/lib/time";

function formatExpiry(value?: string) {
  if (!value) return "";
  return formatTime(value);
}

export function ResetCodeButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(generateResetCodeAction, undefined);

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
        >
          {pending ? "กำลังออกโค้ด..." : "ออกโค้ดรีเซ็ต"}
        </button>
      </form>

      {state?.error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}

      {state?.ok && state.code && (
        <div className="mt-1 rounded-md border border-line bg-sunken px-2 py-1.5">
          <p className="font-mono text-lg font-semibold tracking-[0.3em] text-zinc-900 dark:text-zinc-100">
            {state.code}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            ใช้กับ {state.email} · หมดอายุ {formatExpiry(state.expiresAt)} · ใช้ได้ครั้งเดียว
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(state.code!)}
            className="mt-1 text-[11px] font-medium text-accent hover:underline"
          >
            คัดลอกโค้ด
          </button>
        </div>
      )}
    </div>
  );
}
