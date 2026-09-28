-- ============================================================
-- Password Reset Codes (รีเซ็ตรหัสผ่านโดยไม่ต้องส่งอีเมล)
-- โจทย์: ผู้ใช้กด "ลืมรหัสผ่าน" ที่หน้า login แล้วระบบต้องรีเซ็ตได้เลย
-- โดยไม่ต้องส่งลิงก์ไปอีเมล (SMTP ของ Supabase ส่งถึงแอดมินโปรเจกต์เท่านั้น)
--
-- วิธีใช้: Admin เข้า /admin/users กด "ออกโค้ด" ระบบจะออกโค้ด 6 หลัก
-- ให้ผู้ใช้นำไปกรอกที่หน้า login (อีเมล + โค้ด + รหัสใหม่)
-- โค้ดใช้ได้ครั้งเดียว หมดอายุใน 15 นาที และลองผิดได้ไม่เกิน 5 ครั้ง
--
-- วางโค้ดนี้ลงใน Supabase Dashboard > SQL Editor แล้ว Run
-- โค้ดนี้รันซ้ำได้ (idempotent) และรันลำดับใดก็ได้ ไม่ต้องพึ่งไฟล์อื่น
-- ============================================================

-- ---------- helper function เช็ค Role (ข้าม RLS = ไม่วนลูป) ----------
-- นิยามซ้ำจาก fix_policy_recursion.sql เพื่อให้ไฟล์นี้ standalone ได้
-- (create or replace = idempotent ถ้ารันสองไฟล์ผลเหมือนเดิม)
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

-- ---------- ตารางโค้ดรีเซ็ต ----------
-- เก็บเป็น hash (SHA-256) ไม่เก็บโค้ดจริง ถ้าฐานข้อมูลรั่วก็เอาโค้ดไปใช้รีเซ็ตรหัสผ่านไม่ได้
create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts integer not null default 0,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists password_reset_codes_lookup_idx
  on public.password_reset_codes (email, expires_at desc)
  where used_at is null;

create index if not exists password_reset_codes_user_idx
  on public.password_reset_codes (user_id);

-- โค้ดที่ยังใช้ได้ต้องไม่ซ้ำกัน (กันออกโค้ดเดิม 2 ครั้งติด)
create unique index if not exists password_reset_codes_hash_unique
  on public.password_reset_codes (code_hash);

-- ---------- RLS ----------
-- ตารางนี้ถูกอ่าน/เขียนจาก Server Action ที่ใช้ service role key เท่านั้น
-- ผู้ใช้ทั่วไปเรียก PostgREST ตรง ๆ ไม่ได้ เพราะไม่มี policy สำหรับ insert/update/delete
-- เหลือ policy เดียว: admin ดูรายการโค้ดที่ยังใช้ได้ของตัวเอง
alter table public.password_reset_codes enable row level security;

drop policy if exists "password_reset_codes_select_admin" on public.password_reset_codes;
create policy "password_reset_codes_select_admin" on public.password_reset_codes
  for select to authenticated
  using (public.current_user_role() = 'admin');

-- ---------- บันทึก Audit (ถ้ารัน migration_bonus.sql ไว้แล้ว) ----------
-- โค้ดรีเซ็ตเป็นเรื่องความปลอดภัย จึงควรมี log เสมอ
-- ปลอดภัยแม้ trigger จะบันทึก before/after เพราะในแถวไม่มีโค้ดจริงอยู่แล้ว (มีแต่ hash)
-- ถ้ายังไม่ได้รัน migration_bonus.sql ให้ข้ามส่วนนี้ไป (trigger ถูกสร้างตอนรันไฟล์นั้นภายหลัง)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'log_audit_event'
  ) then
    drop trigger if exists audit_password_reset_codes on public.password_reset_codes;
    execute $trig$
      create trigger audit_password_reset_codes
        after insert or update on public.password_reset_codes
        for each row execute function public.log_audit_event()
    $trig$;
  end if;
end;
$$;

-- ---------- ล้างโค้ดเก่าที่หมดอายุ (เรียกเองได้ หรือตั้ง pg_cron) ----------
-- ข้ามได้ถ้าไม่อยากมีโค้ดเก่าในตาราง ปลอดภัยอยู่แล้วเพราะ query เช็ค expires_at เสมอ
-- delete from public.password_reset_codes where expires_at < now() - interval '7 days';
