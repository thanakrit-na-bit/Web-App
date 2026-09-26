"use client";

import { useState } from "react";
import { exportCsv, type CsvFilters, type CsvKind } from "@/app/actions/export";

export function ExportCsvButton({
  kind,
  filters,
  label = "⬇ Export CSV",
}: {
  kind: CsvKind;
  filters: CsvFilters;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    const result = await exportCsv(kind, filters);
    setBusy(false);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    const blob = new Blob([result.csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {busy ? "กำลังสร้างไฟล์..." : label}
    </button>
  );
}