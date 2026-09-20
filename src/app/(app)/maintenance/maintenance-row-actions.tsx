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
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  },
  {
    status: "Waiting Part",
    label: "Waiting Part",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  },
  {
    status: "Completed",
    label: "Completed",
    className: "bg-green-100 text-green-700 hover:bg-green-200",
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
          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-60 ${a.className}`}
        >
          {a.label}
        </button>
      ))}
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