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

create index if not exists profiles_role_idx on public.profiles (role);

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
-- ใช้ advisory lock เพื่อไม่ให้สมัครพร้อมกันสองคนแล้วทั้งคู่ได้ admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(918273645);

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when not exists (select 1 from public.profiles)
        or not exists (select 1 from public.profiles where role = 'admin')
      then 'admin'
      else 'technician'
    end
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

create index if not exists machines_status_idx on public.machines (status);

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

create index if not exists alarms_machine_id_idx on public.alarms (machine_id);
create index if not exists alarms_status_idx on public.alarms (status);
create index if not exists alarms_occurred_at_idx on public.alarms (occurred_at desc);
create index if not exists alarms_created_by_idx on public.alarms (created_by);

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

create index if not exists maintenance_machine_id_idx on public.maintenance_records (machine_id);
create index if not exists maintenance_status_idx on public.maintenance_records (status);
create index if not exists maintenance_date_idx on public.maintenance_records (maintenance_date desc);

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

-- ============================================================
-- ข้อมูลตัวอย่าง (Seed)
-- รันไฟล์นี้ซ้ำได้ ไม่ทำให้ข้อมูลซ้ำ (ใช้ on conflict / not exists)
-- ต้องการข้อมูลจริงให้ลบทั้งบล็อกนี้ทิ้ง
-- ============================================================

insert into public.machines (machine_id, machine_name, machine_type, location, status) values
  ('M-001', 'CNC Lathe 1',    'CNC Lathe',        'Factory A - Zone 1', 'Running'),
  ('M-002', 'CNC Lathe 2',    'CNC Lathe',        'Factory A - Zone 1', 'Alarm'),
  ('M-003', 'Injection Mach.1','Injection Molding','Factory A - Zone 2', 'Stop'),
  ('M-004', 'Robot Arm 1',    'Robotic Arm',      'Factory B - Zone 1', 'Running'),
  ('M-005', 'Conveyor Belt 3','Conveyor',         'Factory B - Zone 2', 'Maintenance'),
  ('M-006', 'Press Machine 1','Press',            'Factory B - Zone 3', 'Alarm')
on conflict (machine_id) do nothing;

-- Alarm กระจายใน 14 วันล่าสุด เพื่อให้กราฟแนวโน้มบน Dashboard มีข้อมูล
insert into public.alarms (machine_id, alarm_code, alarm_description, occurred_at, cause, status)
select m.id, v.alarm_code, v.alarm_description, v.occurred_at, v.cause, v.status
from (values
  ('M-001', 'AL-1001', 'Spindle temperature exceeded limit',   now() - interval '13 days', 'Coolant pump stopped',        'Closed'),
  ('M-004', 'AL-1002', 'Robot joint 3 servo overload',         now() - interval '13 days', 'Payload exceeded limit',      'Closed'),
  ('M-002', 'AL-1003', 'Tool magazine empty',                  now() - interval '12 days', 'Operator forgot to refill',   'Closed'),
  ('M-001', 'AL-1004', 'Chuck pressure drop detected',         now() - interval '11 days', 'Hydraulic oil leak',         'Closed'),
  ('M-003', 'AL-1005', 'Barrel zone 2 over temperature',       now() - interval '11 days', 'Heater element burnt',        'Closed'),
  ('M-006', 'AL-1006', 'Press slide position out of tolerance',now() - interval '11 days', 'Encoder belt slipped',       'Closed'),
  ('M-002', 'AL-1007', 'Coolant level low',                    now() - interval '10 days', 'Evaporation loss',            'Closed'),
  ('M-004', 'AL-1008', 'Gripper vacuum below threshold',       now() - interval '9 days',  'Vacuum pump worn',            'Closed'),
  ('M-005', 'AL-1009', 'Belt tracking off centre',             now() - interval '9 days',  'Roller bearing worn',         'Closed'),
  ('M-001', 'AL-1010', 'Axis X backlash exceeds limit',        now() - interval '7 days',  'Ball screw needs tightening', 'Closed'),
  ('M-002', 'AL-1011', 'Door interlock not closing',           now() - interval '7 days',  'Safety switch faulty',        'Closed'),
  ('M-006', 'AL-1012', 'Hydraulic pressure unstable',          now() - interval '6 days',  'Pump irregular',              'Closed'),
  ('M-003', 'AL-1013', 'Mould changeover timeout',             now() - interval '5 days',  'Mould release delay',         'Closed'),
  ('M-004', 'AL-1014', 'Axis 2 vibration above threshold',     now() - interval '5 days',  'Bearing imbalance',           'Closed'),
  ('M-002', 'AL-1015', 'Spindle vibration excessive',          now() - interval '5 days',  'Tool overhang too long',      'In Progress'),
  ('M-001', 'AL-1016', 'Coolant concentration out of range',   now() - interval '4 days',  'Mixer malfunction',           'Closed'),
  ('M-005', 'AL-1017', 'Drive motor current spike',            now() - interval '3 days',  'Gearbox wear',                'Closed'),
  ('M-006', 'AL-1018', 'Light curtain interrupted',            now() - interval '3 days',  'Sensor misalignment',        'Open'),
  ('M-002', 'AL-1019', 'Way lubrication low',                   now() - interval '2 days',  'Oil pump blocked',            'Open'),
  ('M-001', 'AL-1020', 'Part length out of tolerance',         now() - interval '1 day',   'Tool wear',                   'Closed'),
  ('M-004', 'AL-1021', 'Controller communication timeout',     now() - interval '1 day',   'Cable connector loose',       'Closed'),
  ('M-003', 'AL-1022', 'Nozzle temperature unstable',          now() - interval '1 day',   'Thermocouple drift',          'Closed'),
  ('M-002', 'AL-1023', 'Chuck jaw alignment error',            now() - interval '0 day',   'Jaw wear',                    'Open'),
  ('M-006', 'AL-1024', 'Cycle time exceeded standard',         now() - interval '0 day',   'Feeding delay',               'Closed')
) as v(machine_id, alarm_code, alarm_description, occurred_at, cause, status)
join public.machines m on m.machine_id = v.machine_id
where not exists (select 1 from public.alarms a where a.alarm_code = v.alarm_code);

insert into public.maintenance_records
  (machine_id, maintenance_type, problem, action_taken, technician, maintenance_date, status)
select m.id, v.maintenance_type, v.problem, v.action_taken, v.technician, v.maintenance_date, v.status
from (values
  ('M-001', 'Preventive',  'Quarterly calibration drift',        'Re-calibrated all axes and backed up parameters', 'ชัยพร', (current_date - 10), 'Completed'),
  ('M-003', 'Corrective',  'Barrel heater failure',              'Replaced heating element and thermocouple',        'ชัยพร', (current_date - 11), 'Completed'),
  ('M-002', 'Corrective',  'Vibration above machine tolerance',  'Ordered replacement bearing set',                 'สมชาย', (current_date - 5),  'Waiting Part'),
  ('M-005', 'Corrective',  'Belt tracking misalignment',         'Realigned rollers, awaiting replacement belt',     'ธนา',   (current_date - 1),  'In Progress'),
  ('M-004', 'Preventive',  'Scheduled robot calibration',        'Pending - waiting for production window',         'ธนา',   (current_date + 7),  'Scheduled'),
  ('M-001', 'Predictive',  'Spindle vibration trend rising',     'Planned spindle bearing inspection',               'สมชาย', (current_date + 2),  'Scheduled'),
  ('M-006', 'Preventive',  'Hydraulic system annual service',   'Pending - parts ordered',                          'ชัยพร', (current_date + 4),  'Scheduled')
) as v(machine_id, maintenance_type, problem, action_taken, technician, maintenance_date, status)
join public.machines m on m.machine_id = v.machine_id
where not exists (
  select 1 from public.maintenance_records r
   where r.machine_id = m.id and r.problem = v.problem
);