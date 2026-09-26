"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAlarm, updateAlarmStatus } from "@/app/actions/alarms";

export function AlarmRowActions({ alarmId }: { alarmId: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    startTransition(async () => {
      const result = await fn();
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm("ยืนยันการลบรายการ Alarm นี้?")) return;
    run(() => deleteAlarm(alarmId));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => run(() => updateAlarmStatus(alarmId, "In Progress"))}
        disabled={pending}
        className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60"
      >
        In Progress
      </button>
      <button
        type="button"
        onClick={() => run(() => updateAlarmStatus(alarmId, "Closed"))}
        disabled={pending}
        className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-60 dark:bg-green-950/60 dark:text-green-300 dark:hover:bg-green-900/60"
      >
        Close
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/60"
      >
        ลบ
      </button>
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  );
}