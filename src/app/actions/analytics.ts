"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/auth";
import { buildAlarmTrend, type TrendPoint } from "@/lib/analytics";

export type TrendResponse = { points: TrendPoint[]; at: number } | { error: string };

export async function fetchAlarmTrend(days = 14): Promise<TrendResponse> {
  const user = await getCurrentUser();
  if (!user) return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  const supabase = await createClient();

  // จำกัดช่วงวันจากฝั่ง client ไว้ ไม่งั้นอาจถูกเรียกด้วยค่ามหาศาล
  const span = Math.min(Math.max(Math.trunc(Number(days) || 14), 1), 365);

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (span - 1));

  const { data, error } = await supabase
    .from("alarms")
    .select("occurred_at, status")
    .gte("occurred_at", from.toISOString())
    .order("occurred_at", { ascending: false })
    .limit(2000);

  if (error) return { error: "เกิดข้อผิดพลาดในการอ่านข้อมูล" };

  return {
    points: buildAlarmTrend(
      (data ?? []) as { occurred_at: string; status: string }[],
      span,
      now
    ),
    at: Date.now(),
  };
}
