"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { addMaintenance, updateMaintenance } from "@/app/actions/maintenance";
import {
  MAINTENANCE_STATUSES,
  type Machine,
  type Maintenance,
} from "@/lib/types";
import { Modal } from "@/components/modal";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function MaintenanceForm({
  machines,
  record,
}: {
  machines: Pick<Machine, "id" | "machine_id" | "machine_name">[];
  record?: Maintenance;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const FORM_ID = `maintenance-form-${useId()}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = record
      ? await updateMaintenance(record.id, formData)
      : await addMaintenance(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95"
      >
        {record ? "แก้ไข" : "➕ บันทึกงานซ่อม"}
      </button>

      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={record ? "แก้ไขงานบำรุงรักษา" : "บันทึกงานบำรุงรักษาใหม่"}
          description="ช่องที่มีเครื่องหมาย * ต้องกรอกให้ครบ"
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                form={FORM_ID}
                disabled={pending}
                className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {pending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    เครื่องจักร <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="machine_id"
                    required
                    defaultValue={record?.machine_id ?? ""}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      -- เลือกเครื่องจักร --
                    </option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.machine_id} - {m.machine_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    ประเภทงานซ่อม <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="maintenance_type"
                    required
                    defaultValue={record?.maintenance_type ?? ""}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      -- เลือก --
                    </option>
                    <option>Preventive</option>
                    <option>Corrective</option>
                    <option>Predictive</option>
                    <option>Breakdown</option>
                    <option>Inspection</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    วันที่ซ่อม
                  </label>
                  <input
                    name="maintenance_date"
                    type="date"
                    defaultValue={
                      record?.maintenance_date ??
                      new Date().toISOString().slice(0, 10)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    ช่างผู้ซ่อม (Technician)
                  </label>
                  <input
                    name="technician"
                    defaultValue={record?.technician ?? ""}
                    placeholder="เช่น Somchai"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ปัญหาที่พบ (Problem) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="problem"
                  required
                  rows={2}
                  defaultValue={record?.problem}
                  placeholder="เช่น Spindle มีเสียงผิดปกติ"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  การแก้ไข (Action Taken) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="action_taken"
                  required
                  rows={2}
                  defaultValue={record?.action_taken}
                  placeholder="เช่น เปลี่ยน bearing ใหม่"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  สถานะ (Status) <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  defaultValue={record?.status ?? "Scheduled"}
                  className={inputClass}
                >
                  {MAINTENANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/40 dark:text-red-300">
                  {error}
                </p>
              )}
            </form>
        </Modal>
      )}
    </>
  );
}