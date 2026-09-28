-- ============================================================
-- ซ่อมโปรไฟล์ที่หายไป
--
-- ปัญหา: ผู้ใช้ที่สมัครก่อนที่ trigger handle_new_user จะถูกสร้าง
--        (เช่น สมัคร/สร้างบัญชีก่อนรัน schema.sql) จะไม่มีแถวใน profiles
--        แถวที่หายไปทำให้:
--          1. ไม่โผล่ในหน้า /admin/users
--          2. เข้าสู่ระบบแล้วไม่มี profile -> ใช้งานไม่ได้
--          3. query แบบ join auth.users กับ profiles จะตัดบัญชีทิ้ง
--
-- วิธีใช้: รันทั้งไฟล์นี้ใน Supabase SQL Editor (ทำซ้ำได้ ไม่พังข้อมูลเดิม)
-- ลำดับ: ควรรันหลัง schema.sql (ต้องมีตาราง profiles อยู่แล้ว)
-- ============================================================

-- ------------------------------------------------------------
-- 1) ตรวจสอบสถานะก่อน (อ่านผลลัพธ์ก่อนรันส่วนที่ 2)
-- ------------------------------------------------------------
select
  u.id,
  u.email,
  u.created_at as "สมัครเมื่อ",
  (p.id is not null) as "มี profile",
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at asc;

-- บัญชีในระบบ Auth ที่ไม่มี profile (ต้องได้ 0 แถวหลังซ่อม)
select u.email as "บัญชีที่ไม่มี profile"
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
order by u.created_at asc;

-- profile ที่ไม่มีบัญชีจริง (บัญชีถูกลบไปแล้ว, เข้าสู่ระบบไม่ได้)
select coalesce(p.full_name, p.id::text) as "profile ที่ไม่มีบัญชี", p.role
from public.profiles p
where not exists (select 1 from auth.users u where u.id = p.id)
order by p.created_at asc;

-- ------------------------------------------------------------
-- 2) ซ่อม: สร้าง profile ให้บัญชีที่ค้าง (idempotent)
--    - ชื่อมาจาก metadata ตอนสมัคร ถ้าไม่มีใช้ส่วนหน้าของอีเมล
--    - ถ้ายังไม่มี admin คนไหนเลย บัญชีแรกที่ซ่อมจะได้เป็น admin
--      (ทำให้กู้บัญชีหายได้จริง ไม่ต้องไปหา admin ที่ไหน)
-- ------------------------------------------------------------
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  ),
  case
    when not exists (select 1 from public.profiles) then 'admin'
    when not exists (select 1 from public.profiles where role = 'admin') then 'admin'
    else 'technician'
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2b) ซ่อม: ถ้าไม่มี admin เลยสักคน ให้บัญชีเก่าสุดที่ยัง login ได้เป็น admin
--     (กรณีนี้เกิดได้ถ้าบัญชี admin เดิมถูกลบ หรือถูกตั้ง role ผิด)
-- ------------------------------------------------------------
update public.profiles p
set role = 'admin'
where not exists (select 1 from public.profiles x where x.role = 'admin')
  and p.id = (
    select u.id from auth.users u
    where exists (select 1 from public.profiles pr where pr.id = u.id)
    order by u.created_at asc
    limit 1
  );

-- ------------------------------------------------------------
-- 3) ยืนยันผลหลังซ่อม
-- ------------------------------------------------------------
select
  u.email,
  coalesce(p.full_name, '(ไม่มีชื่อ)') as "ชื่อ",
  coalesce(p.role::text, '(ไม่มี profile)') as role,
  case when p.id is null then '❌ เข้าใช้ไม่ได้' else '✅' end as "สถานะ",
  u.created_at as "สมัครเมื่อ"
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at asc;

-- สรุป: ตอนนี้มี admin กี่คน (ควรได้ 1 ขึ้นไป)
select coalesce(p.full_name, u.email) as "Admin", u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
order by u.created_at asc;

-- ============================================================
-- ป้องกันไม่ให้เกิดซ้ำ
--
-- trigger เดิมใช้ coalesce(new.email, '') ซึ่งถ้า auth.users ไม่มี email
-- จะได้ '' และบัญชีนั้นจะโผล่ในรายการแต่กรอกโค้ดรีเซ็ตไม่ได้
-- แก้เป็น null เพื่อให้ข้ามการสร้าง profile ของบัญชีที่ไม่มีอีเมล
-- (ปลอดภัยกว่าเดิม และบัญชีไร้อีเมลไม่ควรมีในระบบนี้อยู่แล้ว)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
begin
  -- ถ้าไม่มีอีเมล ไม่สร้าง profile (บัญชีนี้ใช้ระบบไม่ได้อยู่แล้ว)
  if new.email is null or new.email = '' then
    return new;
  end if;

  perform pg_advisory_xact_lock(4242);

  if not exists (select 1 from public.profiles)
     or not exists (select 1 from public.profiles where role = 'admin') then
    new_role := 'admin';
  else
    new_role := 'technician';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ให้แน่ใจว่า trigger ยังอยู่ (ถ้าเคยหลุดจากการแก้ schema.sql)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
