import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * ดึงอีเมลของผู้ใช้ทั้งหมด คืนเป็น map userId -> email
 * ใช้แสดงในหน้า /admin/users (ตาราง profiles ไม่ได้เก็บอีเมลไว้)
 * คืนค่า {} ถ้าไม่ได้ตั้ง service role key เพื่อให้หน้าเว็บยังทำงานได้
 */
export async function listUserEmails(): Promise<Record<string, string>> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};

  const admin = createAdminClient();
  const emails: Record<string, string> = {};
  const perPage = 200;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;

    for (const user of data.users) {
      if (user.email) emails[user.id] = user.email;
    }
    if (data.users.length < perPage) break;
  }

  return emails;
}
