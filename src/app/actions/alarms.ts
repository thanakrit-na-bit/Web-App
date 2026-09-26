"use server";

import { revalidatePath } from "next/cache";
import { requireEditor } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ALARM_STATUSES, type AlarmStatus } from "@/lib/types";
import { validateAlarm } from "@/lib/validation";

export type ActionResult = { error?: string } | undefined;

async function syncMachineStatuses(
  supabase: SupabaseClient,
  machineIds: string[]
) {
  for (const machineId of machineIds) {
    if (!machineId) continue;
    const { data: openAlarms } = await supabase
      .from("alarms")
      .select("id")
      .eq("machine_id", machineId)
      .neq("status", "Closed");

    const { data: machine } = await supabase
      .from("machines")
      .select("status")
      .eq("id", machineId)
      .maybeSingle();

    if (!machine) continue;
    const hasOpen = (openAlarms ?? []).length > 0;
    if (hasOpen && machine.status !== "Alarm") {
      await supabase
        .from("machines")
        .update({ status: "Alarm" })
        .eq("id", machineId);
    } else if (!hasOpen && machine.status === "Alarm") {
      await supabase
        .from("machines")
        .update({ status: "Running" })
        .eq("id", machineId);
    }
  }
}

export async function addAlarm(formData: FormData): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const validated = validateAlarm(formData);
  if (!validated.ok) return { error: validated.error };
  const alarm = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.from("alarms").insert({
    ...alarm,
    created_by: user.id,
  });

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  await syncMachineStatuses(supabase, [alarm.machine_id]);

  revalidatePath("/alarms");
  revalidatePath("/machines");
  revalidatePath("/dashboard");
}

export async function updateAlarm(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const validated = validateAlarm(formData);
  if (!validated.ok) return { error: validated.error };
  const alarm = validated.data;

  const supabase = await createClient();

  const { data: prev } = await supabase
    .from("alarms")
    .select("machine_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("alarms")
    .update(alarm)
    .eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  await syncMachineStatuses(
    supabase,
    Array.from(new Set([prev?.machine_id, alarm.machine_id].filter(Boolean)))
  );

  revalidatePath("/alarms");
  revalidatePath("/machines");
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
  const { data: alarmRow } = await supabase
    .from("alarms")
    .select("machine_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("alarms").update({ status }).eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  await syncMachineStatuses(supabase, [alarmRow?.machine_id]);

  revalidatePath("/alarms");
  revalidatePath("/machines");
  revalidatePath("/dashboard");
}

export async function deleteAlarm(id: string): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const supabase = await createClient();
  const { data: alarmRow } = await supabase
    .from("alarms")
    .select("machine_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("alarms").delete().eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  await syncMachineStatuses(supabase, [alarmRow?.machine_id]);

  revalidatePath("/alarms");
  revalidatePath("/machines");
  revalidatePath("/dashboard");
}