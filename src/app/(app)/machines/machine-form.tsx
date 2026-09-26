"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { addMachine, updateMachine } from "@/app/actions/machines";
import { MACHINE_STATUSES, type Machine } from "@/lib/types";
import { Modal } from "@/components/modal";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function MachineForm({ machine }: { machine?: Machine }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const FORM_ID = `machine-form-${useId()}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = machine
      ? await updateMachine(machine.id, formData)
      : await addMachine(formData);
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
        {machine ? "แก้ไข" : "➕ เพิ่มเครื่องจักร"}
      </button>

      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={machine ? "แก้ไขเครื่องจักร" : "เพิ่มเครื่องจักรใหม่"}
          description="Machine ID ต้องไม่ซ้ำกับข้อมูลที่มีอยู่ในระบบ"
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
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Machine ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="machine_id"
                  required
                  defaultValue={machine?.machine_id}
                  placeholder="เช่น M-001"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ชื่อเครื่องจักร (Machine Name) <span className="text-red-500">*</span>
                </label>
                <input
                  name="machine_name"
                  required
                  defaultValue={machine?.machine_name}
                  placeholder="เช่น CNC Lathe 1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ประเภท (Machine Type) <span className="text-red-500">*</span>
                </label>
                <input
                  name="machine_type"
                  required
                  defaultValue={machine?.machine_type}
                  placeholder="เช่น CNC Lathe"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ตำแหน่งที่ตั้ง (Location) <span className="text-red-500">*</span>
                </label>
                <input
                  name="location"
                  required
                  defaultValue={machine?.location}
                  placeholder="เช่น Factory A - Zone 1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  สถานะ (Status) <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  defaultValue={machine?.status ?? "Running"}
                  className={inputClass}
                >
                  {MACHINE_STATUSES.map((s) => (
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