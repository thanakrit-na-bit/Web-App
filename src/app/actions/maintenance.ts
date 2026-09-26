"use server";

import { revalidatePath } from "next/cache";
import { requireEditor } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "@/lib/types";
import { validateMaintenance } from "@/lib/validation";

export type ActionResult = { error?: string } | undefined;

export async function addMaintenance(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const validated = validateMaintenance(formData);
  if (!validated.ok) return { error: validated.error };
  const record = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_records").insert(record);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function updateMaintenance(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const validated = validateMaintenance(formData);
  if (!validated.ok) return { error: validated.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_records")
    .update(validated.data)
    .eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function updateMaintenanceStatus(
  id: string,
  status: MaintenanceStatus
): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };
  if (!MAINTENANCE_STATUSES.includes(status)) return { error: "สถานะไม่ถูกต้อง" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_records")
    .update({ status })
    .eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function deleteMaintenance(id: string): Promise<ActionResult> {
  const user = await requireEditor();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_records")
    .delete()
    .eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}