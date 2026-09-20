"use server";

import { revalidatePath } from "next/cache";
import { requireEditor } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { ALARM_STATUSES, type AlarmStatus } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

export async function addAlarm(formData: FormData): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const machineId = String(formData.get("machine_id") ?? "").trim();
  const alarmCode = String(formData.get("alarm_code") ?? "").trim();
  const alarmDescription = String(formData.get("alarm_description") ?? "").trim();
  const occurredAt = String(formData.get("occurred_at") ?? "");
  const cause = String(formData.get("cause") ?? "").trim();
  const status = String(formData.get("status") ?? "Open") as AlarmStatus;

  if (!machineId || !alarmCode || !alarmDescription) {
    return { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ (เครื่องจักร, Alarm Code, รายละเอียด)" };
  }
  if (!ALARM_STATUSES.includes(status)) {
    return { error: "สถานะไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("alarms").insert({
    machine_id: machineId,
    alarm_code: alarmCode,
    alarm_description: alarmDescription,
    occurred_at: occurredAt || new Date().toISOString(),
    cause: cause || null,
    status,
    created_by: user.id,
  });

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/alarms");
  revalidatePath("/dashboard");
}

export async function updateAlarm(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const machineId = String(formData.get("machine_id") ?? "").trim();
  const alarmCode = String(formData.get("alarm_code") ?? "").trim();
  const alarmDescription = String(formData.get("alarm_description") ?? "").trim();
  const occurredAt = String(formData.get("occurred_at") ?? "");
  const cause = String(formData.get("cause") ?? "").trim();
  const status = String(formData.get("status") ?? "Open") as AlarmStatus;

  if (!machineId || !alarmCode || !alarmDescription) {
    return { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" };
  }
  if (!ALARM_STATUSES.includes(status)) {
    return { error: "สถานะไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("alarms")
    .update({
      machine_id: machineId,
      alarm_code: alarmCode,
      alarm_description: alarmDescription,
      occurred_at: occurredAt || new Date().toISOString(),
      cause: cause || null,
      status,
    })
    .eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/alarms");
  revalidatePath("/dashboard");
}

export async function updateAlarmStatus(
  id: string,
  status: AlarmStatus
): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };
  if (!ALARM_STATUSES.includes(status)) return { error: "สถานะไม่ถูกต้อง" };

  const supabase = await createClient();
  const { error } = await supabase.from("alarms").update({ status }).eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/alarms");
  revalidatePath("/dashboard");
}

export async function deleteAlarm(id: string): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const supabase = await createClient();
  const { error } = await supabase.from("alarms").delete().eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/alarms");
  revalidatePath("/dashboard");
}