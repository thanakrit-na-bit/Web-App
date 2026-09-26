"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { addAlarm, updateAlarm } from "@/app/actions/alarms";
import { ALARM_STATUSES, type Alarm, type Machine } from "@/lib/types";
import { Modal } from "@/components/modal";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function AlarmForm({
  machines,
  alarm,
}: {
  machines: Pick<Machine, "id" | "machine_id" | "machine_name">[];
  alarm?: Alarm;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const FORM_ID = `alarm-form-${useId()}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = alarm
      ? await updateAlarm(alarm.id, formData)
      : await addAlarm(formData);
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
        className="btn btn-primary"
      >
        {alarm ? "แก้ไข" : "บันทึก Alarm"}
      </button>

      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={alarm ? "แก้ไข Alarm" : "บันทึก Alarm ใหม่"}
          description="ช่องที่มีเครื่องหมาย * ต้องกรอกให้ครบ"
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                form={FORM_ID}
                disabled={pending}
                className="btn btn-primary"
              >
                {pending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  เครื่องจักร (Machine) <span className="text-red-500">*</span>
                </label>
                <select
                  name="machine_id"
                  required
                  defaultValue={alarm?.machine_id ?? ""}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Alarm Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="alarm_code"
                    required
                    defaultValue={alarm?.alarm_code}
                    placeholder="เช่น AL-1001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Date/Time เกิดเหตุ
                  </label>
                  <input
                    name="occurred_at"
                    type="datetime-local"
                    defaultValue={
                      alarm?.occurred_at
                        ? new Date(alarm.occurred_at).toISOString().slice(0, 16)
                        : ""
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  รายละเอียด Alarm (Description) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="alarm_description"
                  required
                  rows={2}
                  defaultValue={alarm?.alarm_description}
                  placeholder="เช่น Motor overheat detected"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  สาเหตุ (Cause)
                </label>
                <textarea
                  name="cause"
                  rows={2}
                  defaultValue={alarm?.cause ?? ""}
                  placeholder="เช่น Bearing failure"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  สถานะ (Status) <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  defaultValue={alarm?.status ?? "Open"}
                  className={inputClass}
                >
                  {ALARM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </p>
              )}
            </form>
        </Modal>
      )}
    </>
  );
}