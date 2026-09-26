"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMaintenance,
  updateMaintenanceStatus,
} from "@/app/actions/maintenance";
import { type MaintenanceStatus } from "@/lib/types";

const statusActions: { status: MaintenanceStatus; label: string; className: string }[] = [
  {
    status: "In Progress",
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60",
  },
  {
    status: "Waiting Part",
    label: "Waiting Part",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60",
  },
  {
    status: "Completed",
    label: "Completed",
    className: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/60 dark:text-green-300 dark:hover:bg-green-900/60",
  },
];

export function MaintenanceRowActions({ recordId }: { recordId: string }) {
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
    if (!confirm("ยืนยันการลบงานบำรุงรักษานี้?")) return;
    run(() => deleteMaintenance(recordId));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {statusActions.map((a) => (
        <button
          key={a.status}
          type="button"
          onClick={() => run(() => updateMaintenanceStatus(recordId, a.status))}
          disabled={pending}
          className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-60 ${a.className}`}
        >
          {a.label}
        </button>
      ))}
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