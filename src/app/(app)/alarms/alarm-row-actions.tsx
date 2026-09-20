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
        className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-60"
      >
        In Progress
      </button>
      <button
        type="button"
        onClick={() => run(() => updateAlarmStatus(alarmId, "Closed"))}
        disabled={pending}
        className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-60"
      >
        Close
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-60"
      >
        ลบ
      </button>
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  );
}