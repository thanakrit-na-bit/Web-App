-- ============================================================
-- Alarm & Maintenance Management System - Supabase Schema
-- วางโค้ดทั้งหมดนี้ลงใน Supabase Dashboard > SQL Editor แล้ว Run
-- โค้ดนี้รันซ้ำได้ (idempotent)
-- ============================================================

-- ---------- PROFILES (เชื่อมกับ auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'technician' check (role in ('admin', 'technician')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_select_all_admin" on public.profiles;
create policy "profiles_select_all_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_role_admin" on public.profiles;
create policy "profiles_update_role_admin" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- สร้าง profile อัตโนมัติเมื่อมี user ใหม่ (user แรกเป็น admin)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when not exists (select 1 from public.profiles) then 'admin' else 'technician' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- MACHINES ----------
create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  machine_id text not null unique,
  machine_name text not null,
  machine_type text not null,
  location text not null,
  status text not null default 'Running' check (status in ('Running', 'Stop', 'Alarm', 'Maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.machines enable row level security;

drop policy if exists "machines_select_authenticated" on public.machines;
create policy "machines_select_authenticated" on public.machines
  for select to authenticated using (true);

drop policy if exists "machines_insert_admin" on public.machines;
create policy "machines_insert_admin" on public.machines
  for insert to authenticated with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "machines_update_admin" on public.machines;
create policy "machines_update_admin" on public.machines
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "machines_delete_admin" on public.machines;
create policy "machines_delete_admin" on public.machines
  for delete to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- ALARMS ----------
create table if not exists public.alarms (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines (id) on delete cascade,
  alarm_code text not null,
  alarm_description text not null,
  occurred_at timestamptz not null default now(),
  cause text,
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Closed')),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.alarms enable row level security;

drop policy if exists "alarms_select_authenticated" on public.alarms;
create policy "alarms_select_authenticated" on public.alarms
  for select to authenticated using (true);

drop policy if exists "alarms_insert_authenticated" on public.alarms;
create policy "alarms_insert_authenticated" on public.alarms
  for insert to authenticated with check (true);

drop policy if exists "alarms_update_authenticated" on public.alarms;
create policy "alarms_update_authenticated" on public.alarms
  for update to authenticated using (true);

drop policy if exists "alarms_delete_authenticated" on public.alarms;
create policy "alarms_delete_authenticated" on public.alarms
  for delete to authenticated using (true);

-- ---------- MAINTENANCE RECORDS ----------
create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines (id) on delete cascade,
  maintenance_type text not null,
  problem text not null,
  action_taken text not null,
  technician text,
  maintenance_date date not null default current_date,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'In Progress', 'Completed', 'Waiting Part')),
  created_at timestamptz not null default now()
);

alter table public.maintenance_records enable row level security;

drop policy if exists "maintenance_select_authenticated" on public.maintenance_records;
create policy "maintenance_select_authenticated" on public.maintenance_records
  for select to authenticated using (true);

drop policy if exists "maintenance_insert_authenticated" on public.maintenance_records;
create policy "maintenance_insert_authenticated" on public.maintenance_records
  for insert to authenticated with check (true);

drop policy if exists "maintenance_update_authenticated" on public.maintenance_records;
create policy "maintenance_update_authenticated" on public.maintenance_records
  for update to authenticated using (true);

drop policy if exists "maintenance_delete_authenticated" on public.maintenance_records;
create policy "maintenance_delete_authenticated" on public.maintenance_records
  for delete to authenticated using (true);

-- อัปเดต updated_at ของ machines อัตโนมัติ
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists machines_touch_updated_at on public.machines;
create trigger machines_touch_updated_at
  before update on public.machines
  for each row execute function public.touch_updated_at();

-- ---------- ข้อมูลตัวอย่าง (ต้องการใช้ก็ Run แยก) ----------
-- insert into public.machines (machine_id, machine_name, machine_type, location, status) values
--   ('M-001', 'CNC Lathe 1', 'CNC Lathe', 'Factory A - Zone 1', 'Running'),
--   ('M-002', 'CNC Lathe 2', 'CNC Lathe', 'Factory A - Zone 1', 'Alarm'),
--   ('M-003', 'Injection Machine 1', 'Injection Molding', 'Factory A - Zone 2', 'Stop'),
--   ('M-004', 'Robot Arm 1', 'Robotic Arm', 'Factory B - Zone 1', 'Running'),
--   ('M-005', 'Conveyor Belt 3', 'Conveyor', 'Factory B - Zone 2', 'Maintenance');