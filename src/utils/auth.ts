import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { can } from "@/lib/permissions";
import { ROLES, type Role } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // โหมด fail-closed: ถ้าอ่าน profile ไม่ได้หรือค่าไม่รู้จัก ให้ถือว่าเป็น viewer (อ่านอย่างเดียว)
  // ไม่ใช่ technician เพราะ technician มีสิทธิ์เขียนข้อมูล
  const stored = profile?.role;
  const role: Role = ROLES.includes(stored as Role) ? (stored as Role) : "viewer";

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name ?? null,
    role,
  };
});

export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

export const requireAdmin = cache(async (): Promise<CurrentUser> => {
  const user = await requireUser();
  if (!can(user.role, "manageUsers")) redirect("/dashboard");
  return user;
});

export const requireEditor = cache(async (): Promise<CurrentUser> => {
  const user = await requireUser();
  if (!can(user.role, "editAlarms")) redirect("/dashboard");
  return user;
});