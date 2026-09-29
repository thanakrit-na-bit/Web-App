# ตัวอย่าง Change Request ที่รองรับ (หัวข้อ 7 โบนัส)

ใบงานระบุตัวอย่าง Change Request ที่อาจารย์/ผู้ใช้งานจะเพิ่มเข้ามา ตารางด้านล่างแสดงว่า
ระบบรองรับครบทุกข้อ และอยู่ตรงไหนของโค้ด

| # | Change Request | สถานะ | รายละเอียด / ไฟล์ที่เกี่ยวข้อง |
| --- | --- | --- | --- |
| 1 | เพิ่มสถานะ **Waiting Part** | ✅ เสร็จ | `supabase/schema.sql` (check constraint), `src/lib/types.ts` (`MAINTENANCE_STATUSES`), หน้า Maintenance, SQL editor สีส้ม |
| 2 | เพิ่ม **Filter ตามช่วงวันที่** | ✅ เสร็จ | `src/app/(app)/alarms/page.tsx` (`from`/`to` → `gte`/`lte`), `src/app/(app)/maintenance/page.tsx` และหน้า Export CSV |
| 3 | เพิ่มข้อมูล **Technician** | ✅ เสร็จ | คอลัมน์ `technician` ใน `maintenance_records`, ช่องกรองช่างผู้ซ่อม, แสดงชื่อช่างในตาราง/CSV |
| 4 | เพิ่ม **กราฟจำนวน Alarm** | ✅ เสร็จ | `src/components/alarm-trend-bars.tsx` (กราฟแท่ง SVG 14 วัน แยกสีตามสถานะ Open/In Progress/Closed, ค่าเริ่มต้นของหน้า Dashboard) + `src/lib/analytics.ts` |
| 5 | เพิ่มหน้า **Machine History** | ✅ เสร็จ | `src/app/(app)/machines/[id]/page.tsx` แสดงประวัติ Alarm และงานบำรุงรักษาของเครื่องจักร |
| 6 | เพิ่ม **Validation เพิ่มเติม** | ✅ เสร็จ | `src/lib/validation.ts` (ความยาว, รูปแบบวันที่, อีเมล, Machine ID ห้ามมีช่องว่าง) + `tests/validation.test.ts` |
| 7 | เพิ่ม **Function ใหม่ตาม Requirement ทุกหนด** | ✅ เสร็จ | ดูตาราง Route → Server Action ในหัวข้อ "Function ที่ใช้ในระบบ" ของ `README.md` |
| 8 | รีเซ็ตรหัสผ่าน **ไม่ต้องส่งอีเมล** | ✅ เสร็จ | `supabase/reset_codes.sql` (ตาราง `password_reset_codes`), `generateResetCodeAction` ใน `src/app/actions/admin.ts`, `requestPasswordResetAction` ใน `src/app/actions/auth.ts`, `src/app/(app)/admin/users/reset-code-button.tsx` |
| 9 | หน้า error / 404 ภาษาไทย | ✅ เสร็จ | `src/app/(app)/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx` — ไม่ให้ผู้ใช้เจอหน้า error ดิบของ Next.js กลางงาน |

## 7. ฟีเจอร์โบนัสที่เพิ่มเพิ่ม (หัวข้อ 7)

| โบนัส | สถานะ | ที่อยู่ของโค้ด |
| --- | --- | --- |
| เพิ่ม Role **Viewer** | ✅ | `supabase/migration_bonus.sql`, `src/lib/permissions.ts`, เมนู/ปุ่มถูกซ่อนในหน้าจอ |
| เพิ่ม **กราฟวิเคราะห์ Alarm** | ✅ | `src/components/alarm-trend-chart.tsx` (สลับแท่ง/เส้น/วงกลม), `src/components/alarm-trend-bars.tsx`, `src/lib/analytics.ts` |
| เพิ่ม **Machine History** | ✅ | `src/app/(app)/machines/[id]/page.tsx` |
| เพิ่ม **Filter ขั้นสูง** (วันที่/เครื่องจักร/ช่างผู้ซ่อม) | ✅ | หน้า Alarms, Maintenance, Machines |
| **Export CSV / Excel** | ✅ | `src/app/actions/export.ts`, `src/lib/csv.ts` (BOM รองรับภาษาไทยใน Excel) |
| **Notification** | ✅ | `src/lib/notifications.ts`, `src/components/notification-bell.tsx` (กระดิ่ง + จุดแดง + อ่านแล้วทั้งหมด) |
| **Audit Log** | ✅ | ตาราง `audit_log` + trigger + หน้า `/admin/audit` |
| **Responsive UI / Dark Mode** | ✅ | `src/components/app-shell.tsx` (Drawer มือถือ), `src/components/theme-toggle.tsx` |
| **รีเซ็ตรหัสผ่านด้วยโค้ดจาก Admin** (ไม่ต้องส่งอีเมล) | ✅ | `supabase/reset_codes.sql`, หน้า `/admin/users`, โหมด "ลืมรหัสผ่าน?" ที่หน้า `/login` |
| แสดง **อีเมล** ของผู้ใช้ในหน้า Admin | ✅ | `listUserEmails()` ใน `src/utils/supabase/admin.ts` + คอลัมน์อีเมลใน `src/app/(app)/admin/users/page.tsx` |

## หมายเหตุ: ทำไมถึงเลิกใช้อีเมลในการรีเซ็ตรหัสผ่าน

SMTP ของ Supabase (แผน free) ส่งอีเมลได้เฉพาะผู้ดูแลโปรเจกต์เท่านั้น
ถ้าใช้ลิงก์รีเซ็ตทางอีเมล ผู้ประเมินหรือช่างในโรงงานจะไม่มีอีเมลให้เข้าถึง
ระบบจึงเปลี่ยนมาใช้ **โค้ดรีเซ็ต 6 หลักที่ Admin เป็นคนออกให้** แทน

| หัวข้อ | วิธีรับป้องกัน |
| --- | --- |
| ใครก็รีเซ็ตรหัสของคนอื่นได้ | โค้ดต้องออกโหมด Admin เท่านั้น (`generateResetCodeAction` เรียก `requireAdmin()`) |
| เดาโค้ดทีละหลัก | กรอกผิดได้ไม่เกิน 5 ครั้ง แล้วโค้ดถูกเผา (`RESET_CODE_MAX_ATTEMPTS`) |
| โค้ดหมดอายุ | `expires_at` = 15 นาที (`RESET_CODE_TTL_MINUTES`) และใช้ได้ครั้งเดียว |
| ใช้โค้ดเดิมซ้ำ | `used_at` ถูกตั้งทันทีเมื่อสำเร็จ พร้อมเผาโค้ดตัวอื่นของอีเมลเดียวกัน |
| เดาเวลาผ่านการเทียบโค้ด | `timingSafeEqual()` เทียบแบบใช้เวลาคงที่ |
| เปิดเผยว่าอีเมลมีบัญชีจริง | ข้อความ error เป็นข้อความเดียวกันทุกกรณี |
| แก้/อ่านโค้ดจากฝั่ง client | เปิด RLS และไม่มี policy สำหรับ insert/update — เข้าถึงได้เฉพาะ Server Action ที่ใช้ service role key |
| โค้ดซ้ำในฐานข้อมูล | `code_hash` มี `unique` constraint + สุ่มด้วย `crypto.randomInt()` + ลองใหม่เมื่อชน |
| ฐานข้อมูลรั่วแล้วเอาโค้ดไปใช้ได้ | เก็บเป็น SHA-256 hash ปน `RESET_CODE_PEPPER` ไม่เก็บโค้ดจริง (`src/lib/reset-code.ts`) |
| โค้ดโผล่ใน Audit Log | แถวข้อมูลไม่มีโค้ดจริงอยู่แล้ว ต่อให้ trigger บันทึก before/after ก็ไม่รั่ว |
| ตรวจสอบย้อนหลัง | trigger `log_audit_event` บันทึกลง `audit_log` (เห็นได้ในหน้า `/admin/audit`) |

### ข้อจำกัดที่ต้องรู้

- **ยังไม่มี rate limit ต่อ IP/อีเมล** ที่ระดับแอป ปัจจุบันการกันเดาโค้ดทำได้แค่ระดับโค้ด
  (5 ครั้งต่อ 1 โค้ด) ถ้านำขึ้นใช้จริงควรเพิ่ม rate limit ที่ Vercel/Upstash ด้วย
- **โค้ดเดิมยังใช้ได้อยู่หลังรีเซ็ตสำเร็จของอีกคน** ถ้า Admin ออกโค้ดให้คนละอีเมล
  ระบบจะเผาเฉพาะโค้ดของอีเมลที่เพิ่งรีเซ็ตสำเร็จ
- **รหัสผ่านเดิมของ session ที่ล็อกอินอยู่ยังใช้ได้** การเปลี่ยนรหัสผ่านไม่ได้บังคับ logout
  session อื่นของบัญชีนั้น (Supabase ต้องเรียก sign out แบบ global ซึ่งยังไม่ได้ทำ)

## หมายเหตุสำหรับการเปลี่ยนแปลงเพิ่มเติมในอนาคต

- **เพิ่มสถานะใหม่:** แก้ `check` constraint ใน `supabase/schema.sql` + เพิ่มค่าใน `src/lib/types.ts`
  (ถ้าต้องการสีเฉพาะ ให้เพิ่มกรณีใน `src/components/status-badge.tsx` — ถ้าไม่เพิ่ม
  หน้าจอจะใช้สีเทาสำรอง `bg-zinc-100` ให้อัตโนมัติ)
- **เพิ่มฟิลด์ในตาราง:** แก้ schema + เพิ่มช่องในฟอร์ม (`*-form.tsx`) + เพิ่มคอลัมน์ในหน้าตาราง
  + เพิ่ม validation ใน `src/lib/validation.ts` + เพิ่มเทสต์
- **เพิ่ม Role ใหม่:** เพิ่มใน `check` constraint ของ `profiles` และใน `src/lib/permissions.ts` (จุดเดียวที่ต้องแก้)
