"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMachine } from "@/app/actions/machines";

export function MachineRowActions({ machineId }: { machineId: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("ยืนยันการลบเครื่องจักรนี้? ข้อมูล Alarm/งานซ่อมที่เกี่ยวข้องจะถูกลบด้วย")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteMachine(machineId);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
      >
        ลบ
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}