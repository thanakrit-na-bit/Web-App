-- ============================================================
-- Bonus Features Migration - Role Viewer + Audit Log
-- วางโค้ดนี้ลงใน Supabase Dashboard > SQL Editor แล้ว Run ต่อจาก schema.sql
-- โค้ดนี้รันซ้ำได้ (idempotent)
-- ============================================================

-- ---------- 1) เพิ่ม Role 'viewer' ให้ profiles ----------
do $$
declare
  c record;
begin
  select conname into c
    from pg_constraint
   where conrelid = 'public.profiles'::regclass and contype = 'c';
  if c.conname is not null then
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'technician', 'viewer'));

-- ---------- 2) ป้องกัน Viewer แก้ไข Alarm (editor = admin/technician) ----------
drop policy if exists "alarms_insert_authenticated" on public.alarms;
create policy "alarms_insert_editor" on public.alarms
  for insert to authenticated with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'technician')
    )
  );

drop policy if exists "alarms_update_authenticated" on public.alarms;
create policy "alarms_update_editor" on public.alarms
  for update to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'technician')
    )
  );

drop policy if exists "alarms_delete_authenticated" on public.alarms;
create policy "alarms_delete_editor" on public.alarms
  for delete to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'technician')
    )
  );

-- ---------- 3) ป้องกัน Viewer แก้ไขงานบำรุงรักษา ----------
drop policy if exists "maintenance_insert_authenticated" on public.maintenance_records;
create policy "maintenance_insert_editor" on public.maintenance_records
  for insert to authenticated with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'technician')
    )
  );

drop policy if exists "maintenance_update_authenticated" on public.maintenance_records;
create policy "maintenance_update_editor" on public.maintenance_records
  for update to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'technician')
    )
  );

drop policy if exists "maintenance_delete_authenticated" on public.maintenance_records;
create policy "maintenance_delete_editor" on public.maintenance_records
  for delete to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'technician')
    )
  );

-- ---------- 4) ตาราง Audit Log ----------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  action text not null,
  target_type text not null,
  target_id uuid,
  details text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log
  for select to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- 5) ฟังก์ชันบันทึก Audit (security definer) ----------
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_action text;
  v_details text;
  v_type text;
begin
  select email into v_email from auth.users where id = auth.uid();

  if tg_op = 'INSERT' then
    v_action := 'INSERT';
    v_details := null;
  elsif tg_op = 'UPDATE' then
    v_action := 'UPDATE';
    v_details := jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))::text;
  else
    v_action := 'DELETE';
    v_details := to_jsonb(OLD)::text;
  end if;

  v_type := tg_table_name;
  if v_type = 'maintenance_records' then
    v_type := 'maintenance';
  end if;

  insert into public.audit_log (user_email, action, target_type, target_id, details)
  values (
    v_email,
    v_action,
    v_type,
    coalesce(NEW.id, OLD.id),
    left(coalesce(v_details, ''), 2000)
  );

  return coalesce(NEW, OLD);
end;
$$;

-- ---------- 6) ผูก trigger เข้ากับทุกตาราง ----------
drop trigger if exists audit_machines on public.machines;
create trigger audit_machines
  after insert or update or delete on public.machines
  for each row execute function public.log_audit_event();

drop trigger if exists audit_alarms on public.alarms;
create trigger audit_alarms
  after insert or update or delete on public.alarms
  for each row execute function public.log_audit_event();

drop trigger if exists audit_maintenance on public.maintenance_records;
create trigger audit_maintenance
  after insert or update or delete on public.maintenance_records
  for each row execute function public.log_audit_event();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.log_audit_event();