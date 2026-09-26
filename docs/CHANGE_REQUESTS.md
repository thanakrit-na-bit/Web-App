# ตัวอย่าง Change Request ที่รองรับ (หัวข้อ 7 โบนัส)

ใบงานระบุตัวอย่าง Change Request ที่อาจารย์/ผู้ใช้งานจะเพิ่มเข้ามา ตารางด้านล่างแสดงว่า
ระบบรองรับครบทุกข้อ และอยู่ตรงไหนของโค้ด

| # | Change Request | สถานะ | รายละเอียด / ไฟล์ที่เกี่ยวข้อง |
| --- | --- | --- | --- |
| 1 | เพิ่มสถานะ **Waiting Part** | ✅ เสร็จ | `supabase/schema.sql` (check constraint), `src/lib/types.ts` (`MAINTENANCE_STATUSES`), หน้า Maintenance, SQL editor สีส้ม |
| 2 | เพิ่ม **Filter ตามช่วงวันที่** | ✅ เสร็จ | `src/app/(app)/alarms/page.tsx` (`from`/`to` → `gte`/`lte`), `src/app/(app)/maintenance/page.tsx` และหน้า Export CSV |
| 3 | เพิ่มข้อมูล **Technician** | ✅ เสร็จ | คอลัมน์ `technician` ใน `maintenance_records`, ช่องกรองช่างผู้ซ่อม, แสดงชื่อช่างในตาราง/CSV |
| 4 | เพิ่ม **กราฟจำนวน Alarm** | ✅ เสร็จ | `src/components/alarm-trend-chart.tsx` (กราฟแท่ง SVG 14 วัน แยกสีตามสถานะ) + `src/lib/analytics.ts` |
| 5 | เพิ่มหน้า **Machine History** | ✅ เสร็จ | `src/app/(app)/machines/[id]/page.tsx` แสดงประวัติ Alarm และงานบำรุงรักษาของเครื่องจักร |
| 6 | เพิ่ม **Validation เพิ่มเติม** | ✅ เสร็จ | `src/lib/validation.ts` (ความยาว, รูปแบบวันที่, อีเมล, Machine ID ห้ามมีช่องว่าง) + `tests/validation.test.ts` |
| 7 | เพิ่ม **Function ใหม่ตาม Requirement ทุกหนด** | ✅ เสร็จ | ดูรายละเอียดด้านล่าง |

## 7. ฟีเจอร์โบนัสที่เพิ่มเพิ่ม (หัวข้อ 7)

| โบนัส | สถานะ | ที่อยู่ของโค้ด |
| --- | --- | --- |
| เพิ่ม Role **Viewer** | ✅ | `supabase/migration_bonus.sql`, `src/lib/permissions.ts`, เมนู/ปุ่มถูกซ่อนในหน้าจอ |
| เพิ่ม **กราฟวิเคราะห์ Alarm** | ✅ | `src/components/alarm-trend-chart.tsx`, `src/lib/analytics.ts` |
| เพิ่ม **Machine History** | ✅ | `src/app/(app)/machines/[id]/page.tsx` |
| เพิ่ม **Filter ขั้นสูง** (วันที่/เครื่องจักร/ช่างผู้ซ่อม) | ✅ | หน้า Alarms, Maintenance, Machines |
| **Export CSV / Excel** | ✅ | `src/app/actions/export.ts`, `src/lib/csv.ts` (BOM รองรับภาษาไทยใน Excel) |
| **Notification** | ✅ | `src/lib/notifications.ts`, `src/components/notification-bell.tsx` (กระดิ่ง + จุดแดง + อ่านแล้วทั้งหมด) |
| **Audit Log** | ✅ | ตาราง `audit_log` + trigger + หน้า `/admin/audit` |
| **Responsive UI / Dark Mode** | ✅ | `src/components/app-shell.tsx` (Drawer มือถือ), `src/components/theme-toggle.tsx` |

## หมายเหตุสำหรับการเปลี่ยนแปลงเพิ่มเติมในอนาคต

- **เพิ่มสถานะใหม่:** แก้ `check` constraint ใน `supabase/schema.sql` + เพิ่มค่าใน `src/lib/types.ts`
  (หน้าจอจะแสดงสีใหม่ให้อัตโนมัติ ให้เพิ่มสีใน `src/components/status-badge.tsx`)
- **เพิ่มฟิลด์ในตาราง:** แก้ schema + เพิ่มช่องในฟอร์ม (`*-form.tsx`) + เพิ่มคอลัมน์ในหน้าตาราง
  + เพิ่ม validation ใน `src/lib/validation.ts` + เพิ่มเทสต์
- **เพิ่ม Role ใหม่:** เพิ่มใน `check` constraint ของ `profiles` และใน `src/lib/permissions.ts` (จุดเดียวที่ต้องแก้)
