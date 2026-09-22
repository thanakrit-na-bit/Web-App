-- ============================================================
-- Fix infinite recursion in RLS policies (profiles self-reference)
-- วางโค้ดนี้ลงใน Supabase Dashboard > SQL Editor แล้ว Run
-- โค้ดนี้รันซ้ำได้ (idempotent)
-- ============================================================

-- ---------- helper function เช็ค Role ปัจจุบัน (ข้าม RLS = ไม่วนลูป) ----------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

-- ---------- PROFILES ----------
drop policy if exists "profiles_select_all_admin" on public.profiles;
create policy "profiles_select_all_admin" on public.profiles
  for select to authenticated
  using (public.current_user_role() = 'admin');

drop policy if exists "profiles_update_role_admin" on public.profiles;
create policy "profiles_update_role_admin" on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'admin');

-- ---------- MACHINES (admin เท่านั้น) ----------
drop policy if exists "machines_insert_admin" on public.machines;
create policy "machines_insert_admin" on public.machines
  for insert to authenticated
  with check (public.current_user_role() = 'admin');

drop policy if exists "machines_update_admin" on public.machines;
create policy "machines_update_admin" on public.machines
  for update to authenticated
  using (public.current_user_role() = 'admin');

drop policy if exists "machines_delete_admin" on public.machines;
create policy "machines_delete_admin" on public.machines
  for delete to authenticated
  using (public.current_user_role() = 'admin');

-- ---------- ALARMS (editor = admin/technician) ----------
drop policy if exists "alarms_insert_editor" on public.alarms;
create policy "alarms_insert_editor" on public.alarms
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'technician'));

drop policy if exists "alarms_update_editor" on public.alarms;
create policy "alarms_update_editor" on public.alarms
  for update to authenticated
  using (public.current_user_role() in ('admin', 'technician'));

drop policy if exists "alarms_delete_editor" on public.alarms;
create policy "alarms_delete_editor" on public.alarms
  for delete to authenticated
  using (public.current_user_role() in ('admin', 'technician'));

-- ---------- MAINTENANCE (editor = admin/technician) ----------
drop policy if exists "maintenance_insert_editor" on public.maintenance_records;
create policy "maintenance_insert_editor" on public.maintenance_records
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'technician'));

drop policy if exists "maintenance_update_editor" on public.maintenance_records;
create policy "maintenance_update_editor" on public.maintenance_records
  for update to authenticated
  using (public.current_user_role() in ('admin', 'technician'));

drop policy if exists "maintenance_delete_editor" on public.maintenance_records;
create policy "maintenance_delete_editor" on public.maintenance_records
  for delete to authenticated
  using (public.current_user_role() in ('admin', 'technician'));

-- ---------- AUDIT LOG (admin เท่านั้น) ----------
drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log
  for select to authenticated
  using (public.current_user_role() = 'admin');