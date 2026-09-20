import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Role } from "@/lib/types";

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

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name ?? null,
    role: (profile?.role as Role) ?? "technician",
  };
});

export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

export const requireAdmin = cache(async (): Promise<CurrentUser> => {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
});