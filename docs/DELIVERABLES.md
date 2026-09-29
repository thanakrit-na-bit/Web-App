# รายการสิ่งที่ต้องส่ง (หัวข้อ 5 ของใบงาน)

| # | สิ่งที่ต้องส่ง | สถานะ | อยู่ที่ |
| --- | --- | --- | --- |
| 1 | GitHub Repository URL | ✅ | https://github.com/thanakrit-na-bit/Web-App |
| 2 | Vercel Deployment URL | ✅ | https://alarm-maint-app.vercel.app |
| 3 | Supabase Database Schema | ✅ | `supabase/schema.sql`, `supabase/migration_bonus.sql`, `supabase/sync_machine_status.sql`, `supabase/fix_policy_recursion.sql`, `supabase/reset_codes.sql`, `supabase/fix_missing_profiles.sql` + สรุปใน README |
| 4 | README | ✅ | `README.md` (เทคโนโลยี, ฟีเจอร์, โครงสร้าง, Database Structure, วิธีติดตั้ง, การทดสอบ, การใช้ AI) |
| 5 | Screenshot หน้าจอระบบ | ✅ | อยู่ในโฟลเดอร์ `screenshots/` (11 ภาพ — ถ่ายจากเว็บจริงที่ความกว้าง 1440px + ภาพมือถือ) |
| 6 | รายงานการใช้ AI | ✅ | `docs/AI_USAGE_REPORT.md` (สรุปย่อใน README หัวข้อ "การใช้งาน AI ในการพัฒนา") |
| 7 | เอกสาร Change Request / โบนัส | ✅ | `docs/CHANGE_REQUESTS.md` |

## วิธีถ่าย Screenshot (หัวข้อ 5)

ต้องเข้าสู่ระบบก่อน จึงจะถ่ายหน้าจอภายในระบบได้ แนะนำให้ถ่ายอย่างน้อย 7 ภาพ
(ถ่ายที่ความกว้าง 1440px และถ่ายภาพมือถือเพิ่ม 1 ภาพเพื่อแสดง Responsive UI)

| ไฟล์ที่แนะนำ | หน้าจอ |
| --- | --- |
| `01-login.png` | หน้า Login |
| `02-dashboard.png` | Dashboard (สถานะเครื่องจักร + กราฟแนวโน้ม Alarm + การแจ้งเตือน) |
| `03-machines.png` | หน้าเครื่องจักร (ตาราง + ช่องค้นหา/กรอง) |
| `04-machine-history.png` | หน้า Machine History |
| `05-alarms.png` | หน้า Alarm (พร้อมฟอร์มเพิ่มข้อมูล + ตัวกรอง) |
| `06-maintenance.png` | หน้างานบำรุงรักษา (สถานะ Waiting Part) |
| `07-admin-users.png` | หน้าผู้ใช้งาน (Admin) พร้อมปุ่ม "ออกโค้ดรีเซ็ต" |
| `08-audit-log.png` | หน้า Audit Log |
| `09-dark-mode.png` | หน้าใดก็ได้ในโหมดมืด |
| `10-mobile.png` | หน้าใดก็ได้บนมือถือ (เมนู Drawer) |
| `11-forgot-password.png` | หน้า Login ตอนกด "ลืมรหัสผ่าน?" (กรอกอีเมล + รหัสรีเซ็ต + รหัสผ่านใหม่ ไม่ต้องส่งอีเมล) |

> หมายเหตุ: ถ้าต้องการภาพตัวอย่างจำนวนมาก ให้เตรียมข้อมูลตัวอย่างด้วยตัวอย่างใน
> `supabase/schema.sql` (ท้ายไฟล์) แล้วถ่ายซ้ำเพื่อให้ Dashboard และกราฟแสดงข้อมูลครบถ้วน
