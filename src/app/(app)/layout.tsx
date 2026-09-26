import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { AppShell } from "@/components/app-shell";
import { RememberEmail } from "@/components/remember-email";
import { buildNotifications, type AppNotification } from "@/lib/notifications";

const getNotifications = cache(async (): Promise<AppNotification[]> => {
  const supabase = await createClient();

  const [alarmsRes, maintenanceRes] = await Promise.all([
    supabase
      .from("alarms")
      .select("id, alarm_code, status, occurred_at, machines(machine_id)")
      .neq("status", "Closed")
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("maintenance_records")
      .select("id, status, maintenance_date, machines(machine_id)")
      .in("status", ["Scheduled", "In Progress"])
      .order("maintenance_date", { ascending: true })
      .limit(50),
  ]);

  return buildNotifications({
    alarms: (alarmsRes.data ?? []).map((a) => ({
      id: a.id,
      alarm_code: a.alarm_code,
      status: a.status,
      occurred_at: a.occurred_at,
      machineLabel: (a.machines as { machine_id?: string } | null)?.machine_id ?? null,
    })),
    maintenance: (maintenanceRes.data ?? []).map((m) => ({
      id: m.id,
      status: m.status,
      maintenance_date: m.maintenance_date,
      machineLabel:
        (m.machines as { machine_id?: string } | null)?.machine_id ?? null,
    })),
  });
});

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const notifications = await getNotifications();

  return (
    <AppShell
      user={{
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      }}
      notifications={notifications}
    >
      <RememberEmail />
      {children}
    </AppShell>
  );
}
