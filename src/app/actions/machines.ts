"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { MACHINE_STATUSES, type MachineStatus } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

export async function addMachine(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const machineId = String(formData.get("machine_id") ?? "").trim();
  const machineName = String(formData.get("machine_name") ?? "").trim();
  const machineType = String(formData.get("machine_type") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const status = String(formData.get("status") ?? "Running") as MachineStatus;

  if (!machineId || !machineName || !machineType || !location) {
    return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }
  if (!MACHINE_STATUSES.includes(status)) {
    return { error: "สถานะไม่ถูกต้อง" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("machines")
    .select("id")
    .eq("machine_id", machineId)
    .maybeSingle();

  if (existing) {
    return { error: "Machine ID นี้มีอยู่แล้ว กรุณาใช้ ID อื่น" };
  }

  const { error } = await supabase.from("machines").insert({
    machine_id: machineId,
    machine_name: machineName,
    machine_type: machineType,
    location,
    status,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Machine ID นี้มีอยู่แล้ว กรุณาใช้ ID อื่น" };
    }
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath("/machines");
  revalidatePath("/dashboard");
}

export async function updateMachine(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const machineId = String(formData.get("machine_id") ?? "").trim();
  const machineName = String(formData.get("machine_name") ?? "").trim();
  const machineType = String(formData.get("machine_type") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const status = String(formData.get("status") ?? "Running") as MachineStatus;

  if (!machineId || !machineName || !machineType || !location) {
    return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }
  if (!MACHINE_STATUSES.includes(status)) {
    return { error: "สถานะไม่ถูกต้อง" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("machines")
    .select("id")
    .eq("machine_id", machineId)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return { error: "Machine ID นี้มีอยู่แล้ว กรุณาใช้ ID อื่น" };
  }

  const { error } = await supabase
    .from("machines")
    .update({
      machine_id: machineId,
      machine_name: machineName,
      machine_type: machineType,
      location,
      status,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Machine ID นี้มีอยู่แล้ว กรุณาใช้ ID อื่น" };
    }
    return { error: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath("/machines");
  revalidatePath("/dashboard");
}

export async function deleteMachine(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const supabase = await createClient();
  const { error } = await supabase.from("machines").delete().eq("id", id);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/machines");
  revalidatePath("/dashboard");
}