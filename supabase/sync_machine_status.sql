-- ============================================================
-- Auto-sync Machine Status จาก Alarm (ทำที่ DB ด้วย trigger)
-- วางโค้ดนี้ลงใน Supabase Dashboard > SQL Editor แล้ว Run
-- โค้ดนี้รันซ้ำได้ (idempotent)
--
-- หลักการ:
--  - INSERT/UPDATE/DELETE Alarm ทุกครั้ง -> trigger ตรวจว่ามี Alarm
--    ที่ยังไม่ปิด (status <> 'Closed') ของเครื่องนั้นหรือไม่
--  - มี -> สถานะเครื่องเป็น 'Alarm'
--  - ไม่มี -> ถ้าเครื่องกำลังเป็น 'Alarm' ให้กลับเป็น 'Running'
--  (เครื่องที่ตั้ง Stop/Maintenance ไว้จะไม่ถูกบังคับเปลี่ยน)
-- ============================================================

create or replace function public.sync_machine_status_on_alarm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_machine_id uuid;
  v_open_count integer;
begin
  v_machine_id := coalesce(NEW.machine_id, OLD.machine_id);
  if v_machine_id is null then
    return coalesce(NEW, OLD);
  end if;

  select count(*) into v_open_count
    from public.alarms
   where machine_id = v_machine_id and status <> 'Closed';

  if v_open_count > 0 then
    update public.machines
       set status = 'Alarm'
     where id = v_machine_id and status <> 'Alarm';
  else
    update public.machines
       set status = 'Running'
     where id = v_machine_id and status = 'Alarm';
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists sync_machine_status on public.alarms;
create trigger sync_machine_status
  after insert or update or delete on public.alarms
  for each row execute function public.sync_machine_status_on_alarm();

-- ---------- ปรับสถานะเครื่องตามข้อมูลเดิมที่มีอยู่แล้ว ----------
update public.machines m
   set status = 'Alarm'
 where m.status <> 'Alarm'
   and exists (
     select 1 from public.alarms a
      where a.machine_id = m.id and a.status <> 'Closed'
   );