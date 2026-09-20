"use server";

import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth";
import { buildCsv } from "@/lib/csv";

export type CsvKind = "machines" | "alarms" | "maintenance";
export type CsvFilters = {
  q?: string;
  status?: string;
  machine?: string;
  technician?: string;
  from?: string;
  to?: string;
};

export type ExportResult = { csv: string; name: string } | { error: string };

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function inList(v: string | null, list: readonly string[]): string | null {
  return v && (list as readonly string[]).includes(v) ? v : null;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export async function exportCsv(
  kind: CsvKind,
  filters: CsvFilters
): Promise<ExportResult> {
  await requireUser();
  const supabase = await createClient();

  if (kind === "machines") {
    const query = supabase
      .from("machines")
      .select("*")
      .order("machine_id", { ascending: true });

    const q = str(filters.q);
    const status = inList(str(filters.status), [
      "Running",
      "Stop",
      "Alarm",
      "Maintenance",
    ]);

    if (q) {
      query.or(
        `machine_id.ilike.%${q}%,machine_name.ilike.%${q}%,machine_type.ilike.%${q}%,location.ilike.%${q}%`
      );
    }
    if (status) query.eq("status", status);

    const { data, error } = await query;
    if (error || !data) return { error: "เกิดข้อผิดพลาดในการอ่านข้อมูล" };

    const csv = buildCsv(
      ["Machine ID", "ชื่อเครื่องจักร", "ประเภท", "ตำแหน่ง", "สถานะ", "วันที่เพิ่ม"],
      data.map((m) => [
        m.machine_id,
        m.machine_name,
        m.machine_type,
        m.location,
        m.status,
        formatDateTime(m.created_at),
      ])
    );
    return { csv, name: "machines.csv" };
  }

  const { data: machines } = await supabase
    .from("machines")
    .select("id, machine_id, machine_name");
  const machineMap = new Map<string, string>(
    (machines ?? []).map((m) => [
      m.id,
      `${m.machine_id} - ${m.machine_name}`,
    ])
  );

  if (kind === "alarms") {
    const query = supabase
      .from("alarms")
      .select("*")
      .order("occurred_at", { ascending: false });

    const q = str(filters.q);
    const status = inList(str(filters.status), ["Open", "In Progress", "Closed"]);
    const machineId = str(filters.machine);
    const from = str(filters.from);
    const to = str(filters.to);

    if (q) {
      query.or(
        `alarm_code.ilike.%${q}%,alarm_description.ilike.%${q}%,cause.ilike.%${q}%`
      );
    }
    if (status) query.eq("status", status);
    if (machineId) query.eq("machine_id", machineId);
    if (from) query.gte("occurred_at", `${from}T00:00:00`);
    if (to) query.lte("occurred_at", `${to}T23:59:59`);

    const { data, error } = await query;
    if (error || !data) return { error: "เกิดข้อผิดพลาดในการอ่านข้อมูล" };

    const csv = buildCsv(
      [
        "เครื่องจักร",
        "Alarm Code",
        "รายละเอียด",
        "Date/Time",
        "สาเหตุ",
        "สถานะ",
      ],
      data.map((a) => [
        machineMap.get(a.machine_id) ?? a.machine_id,
        a.alarm_code,
        a.alarm_description,
        formatDateTime(a.occurred_at),
        a.cause ?? "",
        a.status,
      ])
    );
    return { csv, name: "alarms.csv" };
  }

  const query = supabase
    .from("maintenance_records")
    .select("*")
    .order("maintenance_date", { ascending: false });

  const q = str(filters.q);
  const status = inList(str(filters.status), [
    "Scheduled",
    "In Progress",
    "Completed",
    "Waiting Part",
  ]);
  const machineId = str(filters.machine);
  const technician = str(filters.technician);
  const from = str(filters.from);
  const to = str(filters.to);

  if (q) query.or(`problem.ilike.%${q}%,action_taken.ilike.%${q}%`);
  if (status) query.eq("status", status);
  if (machineId) query.eq("machine_id", machineId);
  if (technician) query.ilike("technician", `%${technician}%`);
  if (from) query.gte("maintenance_date", from);
  if (to) query.lte("maintenance_date", to);

  const { data, error } = await query;
  if (error || !data) return { error: "เกิดข้อผิดพลาดในการอ่านข้อมูล" };

  const csv = buildCsv(
    [
      "เครื่องจักร",
      "ประเภทงานซ่อม",
      "ปัญหา",
      "การแก้ไข",
      "ช่างผู้ซ่อม",
      "วันที่",
      "สถานะ",
    ],
    data.map((r) => [
      machineMap.get(r.machine_id) ?? r.machine_id,
      r.maintenance_type,
      r.problem,
      r.action_taken,
      r.technician ?? "",
      r.maintenance_date,
      r.status,
    ])
  );
  return { csv, name: "maintenance.csv" };
}