"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import type { Role } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

export async function updateUserRole(
  userId: string,
  role: Role
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };
  if (role !== "admin" && role !== "technician") {
    return { error: "Role ไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/admin/users");
}