"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

export async function addMaintenance(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const machineId = String(formData.get("machine_id") ?? "").trim();
  const maintenanceType = String(formData.get("maintenance_type") ?? "").trim();
  const problem = String(formData.get("problem") ?? "").trim();
  const actionTaken = String(formData.get("action_taken") ?? "").trim();
  const technician = String(formData.get("technician") ?? "").trim();
  const maintenanceDate = String(formData.get("maintenance_date") ?? "");
  const status = String(formData.get("status") ?? "Scheduled") as MaintenanceStatus;

  if (!machineId || !maintenanceType || !problem || !actionTaken) {
    return { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ (เครื่องจักร, ประเภทงานซ่อม, ปัญหา, การแก้ไข)" };
  }
  if (!MAINTENANCE_STATUSES.includes(status)) {
    return { error: "สถานะไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_records").insert({
    machine_id: machineId,
    maintenance_type: maintenanceType,
    problem,
    action_taken: actionTaken,
    technician: technician || null,
    maintenance_date: maintenanceDate || new Date().toISOString().slice(0, 10),
    status,
  });

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function updateMaintenance(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const machineId = String(formData.get("machine_id") ?? "").trim();
  const maintenanceType = String(formData.get("maintenance_type") ?? "").trim();
  const problem = String(formData.get("problem") ?? "").trim();
  const actionTaken = String(formData.get("action_taken") ?? "").trim();
  const technician = String(formData.get("technician") ?? "").trim();
  const maintenanceDate = String(formData.get("maintenance_date") ?? "");
  const status = String(formData.get("status") ?? "Scheduled") as MaintenanceStatus;

  if (!machineId || !maintenanceType || !problem || !actionTaken) {
    return { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" };
  }
  if (!MAINTENANCE_STATUSES.includes(status)) {
    return { error: "สถานะไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_records")
    .update({
      machine_id: machineId,
      maintenance_type: maintenanceType,
      problem,
      action_taken: actionTaken,
      technician: technician || null,
      maintenance_date: maintenanceDate || new Date().toISOString().slice(0, 10),
      status,
    })
    .eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function updateMaintenanceStatus(
  id: string,
  status: MaintenanceStatus
): Promise<ActionResult> {
  const user = await requireUser();
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
  const user = await requireUser();
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