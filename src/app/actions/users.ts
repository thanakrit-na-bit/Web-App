"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { ROLES, type Role } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

export async function updateUserRole(
  userId: string,
  role: Role
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!user) return { error: "ไม่ได้รับอนุญาต" };
  if (!ROLES.includes(role)) {
    return { error: "Role ไม่ถูกต้อง" };
  }

  const supabase = await createClient();

  // กันไม่ให้ผู้ดูแลคนสุดท้ายถูกลดสิทธิ์จนระบบไม่มีใครจัดการได้
  if (role !== "admin") {
    const { data: target } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (target?.role === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return { error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน จึงจะลดสิทธิ์ผู้ดูแลคนนี้ได้" };
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/admin/users");
}