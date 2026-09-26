"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { validateMachine } from "@/lib/validation";

export type ActionResult = { error?: string } | undefined;

export async function addMachine(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };

  const validated = validateMachine(formData);
  if (!validated.ok) return { error: validated.error };
  const machine = validated.data;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("machines")
    .select("id")
    .eq("machine_id", machine.machine_id)
    .maybeSingle();

  if (existing) {
    return { error: "Machine ID นี้มีอยู่แล้ว กรุณาใช้ ID อื่น" };
  }

  const { error } = await supabase.from("machines").insert(machine);

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

  const validated = validateMachine(formData);
  if (!validated.ok) return { error: validated.error };
  const machine = validated.data;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("machines")
    .select("id")
    .eq("machine_id", machine.machine_id)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return { error: "Machine ID นี้มีอยู่แล้ว กรุณาใช้ ID อื่น" };
  }

  const { error } = await supabase
    .from("machines")
    .update(machine)
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