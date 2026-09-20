"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAlarm, updateAlarm } from "@/app/actions/alarms";
import { ALARM_STATUSES, type Alarm, type Machine } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

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
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        {alarm ? "แก้ไข" : "➕ บันทึก Alarm"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">
                {alarm ? "แก้ไข Alarm" : "บันทึก Alarm ใหม่"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
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
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
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
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
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
                <label className="mb-1 block text-sm font-medium text-zinc-700">
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
                <label className="mb-1 block text-sm font-medium text-zinc-700">
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
                <label className="mb-1 block text-sm font-medium text-zinc-700">
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
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}