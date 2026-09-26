"use client";

import { useState } from "react";
import { exportCsv, type CsvFilters, type CsvKind } from "@/app/actions/export";
import { Icon } from "@/components/icon";

export function ExportCsvButton({
  kind,
  filters,
  label = "Export CSV",
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
      className="btn btn-ghost"
    >
      <Icon name="download" className="h-4 w-4" />
      {busy ? "กำลังสร้างไฟล์..." : label}
    </button>
  );
}