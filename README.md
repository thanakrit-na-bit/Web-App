# Alarm & Maintenance Management System

ระบบจัดการเครื่องจักร แจ้งเตือน (Alarm) และงานบำรุงรักษา (Maintenance) สำหรับรายวิชา Programming in Automation Systems

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + Tailwind CSS + TypeScript
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **CI/CD:** GitHub Actions + Vercel
- **Version Control:** GitHub

## Features

- Login / Logout ด้วย Supabase Auth
- **ลืมรหัสผ่านโดยไม่ต้องส่งอีเมล** — Admin ออกโค้ดรีเซ็ต 6 หลักที่ `/admin/users` แล้วผู้ใช้กรอก
  อีเมล + โค้ด + รหัสใหม่ที่หน้า login ได้เลย (โค้ดใช้ครั้งเดียว หมดอายุ 15 นาที ผิดได้ 5 ครั้ง)
  รายละเอียดที่ [`supabase/reset_codes.sql`](supabase/reset_codes.sql)
- 3 บทบาท: **Admin**, **Technician** และ **Viewer** (โบนัส)
- ควบคุมสิทธิ์ทุกหน้าจอด้วยตารางสิทธิ์กลาง (`src/lib/permissions.ts`) + RLS ที่ฝั่ง Supabase
  - **Admin** จัดการได้ทุกอย่าง (Machine, Alarm, Maintenance, ผู้ใช้, Audit Log)
  - **Technician** ดูข้อมูลได้ทั้งหมด และเพิ่ม/แก้ไข/เปลี่ยนสถานะ Alarm และงานบำรุงรักษาได้
  - **Viewer** ดูอย่างเดียว (อ่านข้อมูลได้ แก้ไขไม่ได้)
- จัดการ **Machine** (CRUD: Machine ID, ชื่อ, ประเภท, ตำแหน่ง, สถานะ)
- จัดการ **Alarm** (CRUD: เชื่อมโยงเครื่องจักร, Alarm Code, รายละเอียด, เวลาเกิด, สาเหตุ, สถานะ)
- จัดการ **Maintenance** (CRUD: ประเภทงาน, ปัญหา, การแก้ไข, ช่างผู้ซ่อม, วันที่, สถานะ)
- Machine History: หน้ารายละเอียดเครื่องจักรพร้อมประวัติ Alarm และงานซ่อม
- Search & Filter (ค้นหา + กรองตามเครื่องจักร / สถานะ / ช่างผู้ซ่อม / ช่วงวันที่)
- Dashboard สรุปยอดรวม (เครื่องจักร, สถานะ Alarm, งานบำรุงรักษา, Alarm ที่ค้าง, งานซ่อมที่ถึงกำหนด)
- **กราฟวิเคราะห์ Alarm 14 วันล่าสุด** เลือกดูได้ 2 แบบ: วงกลม (radar) หรือเส้น (linear) — `src/components/alarm-trend-chart.tsx`
- **Notification** กระดิ่งแจ้งเตือน: Alarm ค้าง, งานซ่อมเกินกำหนด (มีจุดแดงบอกยังไม่อ่าน) — `src/lib/notifications.ts`
- Export CSV (เครื่องจักร / Alarm / Maintenance) ตามตัวกรองที่เลือก
- Audit Log บันทึกทุกการเพิ่ม/แก้ไข/ลบ (หน้า `/admin/audit`)
- หน้า Admin จัดการบทบาทผู้ใช้และรีเซ็ตรหัสผ่านให้ผู้ใช้ได้
- Input Validation ทั้งฝั่ง client และ server (ตรวจช่องว่าง, สถานะ, ความยาว, รูปแบบวันที่/อีเมล)
- Responsive UI (เมนู Drawer บนมือถือ) + Dark Mode + จดจำอีเมลไว้ในเครื่อง
- Unit Test 80 เคสด้วย Vitest (รันใน GitHub Actions ทุกครั้งที่ push)

## เอกสารประกอบ

- [`docs/DELIVERABLES.md`](docs/DELIVERABLES.md) — รายการสิ่งที่ต้องส่งตามหัวข้อ 5 ของใบงาน
- [`docs/AI_USAGE_REPORT.md`](docs/AI_USAGE_REPORT.md) — รายงานการใช้ AI ในการพัฒนา (หัวข้อ 4)
- [`docs/CHANGE_REQUESTS.md`](docs/CHANGE_REQUESTS.md) — ตัวอย่าง Change Request และฟีเจอร์โบนัส (หัวข้อ 7)

## ความคืบหน้าตามข้อกำหนดใบงาน (3.1–3.12)

| ข้อ | ความต้องการ | สถานะ | อยู่ที่ |
| --- | --- | --- | --- |
| 3.1 | ระบบผู้ใช้งาน (Login/Logout, 2+ Role, คุมสิทธิ์ทุกหน้าจอ) | ✅ | `src/app/(auth)/login`, `src/utils/auth.ts`, `src/lib/permissions.ts`, RLS ใน `supabase/` |
| 3.2 | Machine Master (4 สถานะ + CRUD) | ✅ | `src/app/(app)/machines`, `src/app/actions/machines.ts` |
| 3.3 | Alarm Record (Open/In Progress/Closed) | ✅ | `src/app/(app)/alarms`, `src/app/actions/alarms.ts` |
| 3.4 | Maintenance Record | ✅ | `src/app/(app)/maintenance`, `src/app/actions/maintenance.ts` |
| 3.5 | Search & Filter (อย่างน้อย 2 เงื่อนไข) | ✅ | ทุกหน้าตาราง (ค้นหา + เครื่องจักร + สถานะ + ช่วงวันที่ + ช่างผู้ซ่อม) |
| 3.6 | Dashboard (จำนวนเครื่อง/สถานะ/Alarm/Maintenance + กราฟ) | ✅ | `src/app/(app)/dashboard`, `src/components/alarm-trend-chart.tsx` |
| 3.7 | Input Validation (Machine ID ห้ามซ้ำ, แจ้ง error) | ✅ | `src/lib/validation.ts` + unique constraint + `tests/validation.test.ts` |
| 3.8 | Database (profiles, machines, alarms, maintenance_records) | ✅ | `supabase/schema.sql` (+ ไฟล์ migration) |
| 3.9 | GitHub (ประวัติ Commit + README) | ✅ | repository + `README.md` |
| 3.10 | GitHub Actions (Install, Build, **Run Test**) | ✅ | `.github/workflows/ci.yml` |
| 3.11 | Deployment บน Vercel (URL ใช้งานได้จริง) | ✅ | https://alarm-maint-app.vercel.app |
| 3.12 | README (โครงการ, Function, Technology, DB, วิธีติดตั้ง, URL, AI) | ✅ | `README.md` |

## Project Structure

```
alarm-maint-app/
├── src/
│   ├── app/
│   │   ├── (app)/          # หน้าหลัง login (dashboard, machines, alarms, maintenance, admin)
│   │   │                   # + error.tsx / loading.tsx จับ error เป็นภาษาไทย
│   │   ├── (auth)/login/   # หน้าเข้าสู่ระบบ (มีโหมดรีเซ็ตรหัสผ่านแบบใส่โค้ด)
│   │   ├── actions/        # Server Actions (ตรวจสิทธิ์ + validate ก่อนเขียน DB)
│   │   ├── global-error.tsx# จับ error ระดับ root layout (พังแล้วยังเห็นหน้าเว็บ)
│   │   ├── not-found.tsx   # หน้า 404 ภาษาไทย
│   │   └── loading.tsx     # สปินเนอร์ตอนเปลี่ยนหน้า
│   ├── components/         # UI components (app-shell, notification-bell, alarm-trend-*)
│   ├── lib/                # types, validation, permissions, notifications, analytics, csv, chart
│   ├── proxy.ts            # Middleware (Next.js 16)
│   └── utils/supabase/     # client / server / middleware helpers
├── docs/                   # เอกสารประกอบการส่งงาน (AI report, deliverables, change requests)
├── supabase/
│   ├── schema.sql              # ตารางหลัก + RLS policies + index + ข้อมูลตัวอย่าง
│   ├── migration_bonus.sql     # Role Viewer + ตาราง Audit Log + trigger บันทึก log
│   ├── sync_machine_status.sql # trigger ซิงก์สถานะเครื่องจักรจาก Alarm
│   ├── fix_policy_recursion.sql# แก้ปัญหา RLS infinite recursion (รันเป็นไฟล์สุดท้าย)
│   ├── reset_codes.sql          # ตาราง password_reset_codes (รีเซ็ตรหัสผ่านไม่ต้องส่งอีเมล)
│   └── fix_missing_profiles.sql # ซ่อม profile ที่หาย (บัญชีสมัครก่อน trigger ถูกสร้าง)
├── tests/                  # Vitest unit tests
├── vitest.config.ts
└── .github/workflows/ci.yml
```

## Function ที่ใช้ในระบบ

### Route → Server Action → ตัวช่วย → การคุมสิทธิ์

| Route | Server Action (`src/app/actions/`) | ตัวช่วย (`src/lib/`) | ใครทำได้ |
| --- | --- | --- | --- |
| `/login` | `loginAction`, `signupAction`, `requestPasswordResetAction` | `isValidEmail`, `isValidPassword`, `isValidResetCode`, `timingSafeEqual` | ทุกคน (ยังไม่ล็อกอิน) |
| `/change-password` | `changePasswordAction` | `isValidPassword` | ทุกคนที่ล็อกอิน |
| `/dashboard` | `fetchAlarmTrend` (poll ทุก 10 วินาที) | `buildAlarmTrend`, `buildStatusSummary` | ทุก Role |
| `/machines` | `addMachine`, `updateMachine`, `deleteMachine` | `validateMachine` | อ่าน: ทุก Role / เขียน: Admin |
| `/machines/[id]` | — (อ่านอย่างเดียว) | — | ทุก Role |
| `/alarms` | `addAlarm`, `updateAlarm`, `updateAlarmStatus`, `deleteAlarm` | `validateAlarm` | อ่าน: ทุก Role / เขียน: Admin, Technician |
| `/maintenance` | `addMaintenance`, `updateMaintenance`, `updateMaintenanceStatus`, `deleteMaintenance` | `validateMaintenance` | อ่าน: ทุก Role / เขียน: Admin, Technician |
| `/admin/users` | `updateUserRole`, `adminResetPassword`, `generateResetCodeAction` | `ROLES`, `RESET_CODE_LENGTH` | Admin |
| `/admin/audit` | — (อ่านอย่างเดียว) | `NOTIFICATION_RULES` | Admin |
| ปุ่ม Export CSV | `exportCsv` | `buildCsv`, `sanitizeSearch` | ทุก Role |
| กระดิ่งแจ้งเตือน | — (อ่านใน layout) | `buildNotifications`, `countBySeverity` | ทุก Role |

### ฟังก์ชันหลักใน `src/lib/`

| ไฟล์ | ฟังก์ชัน | หน้าที่ |
| --- | --- | --- |
| `validation.ts` | `validateMachine` / `validateAlarm` / `validateMaintenance` | ตรวจช่องว่าง, ค่าสถานะ, ความยาว, รูปแบบวันที่ แล้วคืนข้อความ error ภาษาไทย |
| `validation.ts` | `isValidEmail` / `isValidPassword` | ตรวจรูปแบบอีเมลและความยาวรหัสผ่าน |
| `validation.ts` | `isValidResetCode` / `timingSafeEqual` | ตรวจโค้ดรีเซ็ตเป็นตัวเลข 6 หลัก และเทียบโค้ดแบบใช้เวลาคงที่ |
| `validation.ts` | `sanitizeSearch` | escape คำค้นก่อนส่งเข้า PostgREST `.or()` กันการแทรกเงื่อนไข |
| `permissions.ts` | `can(role, permission)` | ตารางสิทธิ์กลาง ใช้ทั้งซ่อนปุ่มใน UI และยืนยันฝั่ง server |
| `analytics.ts` | `buildAlarmTrend` / `buildStatusSummary` | คำนวณข้อมูลกราฟแนวโน้มและสัดส่วนสถานะ |
| `notifications.ts` | `buildNotifications` / `countBySeverity` | สร้างรายการแจ้งเตือนตามกติกา (Alarm ค้าง, งานซ่อมเกินกำหนด) |
| `csv.ts` | `buildCsv` | สร้าง CSV พร้อม BOM เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง |
| `chart.ts` | `smoothLine` / `smoothLoop` / `useTweenedSeries` | คณิตสร้างเส้นกราฟ (Catmull-Rom) และ tween ค่าด้วย rAF |
| `chart.ts` | `movingAverage` / `polarPoint` | ค่าเฉลี่ยเคลื่อนที่สำหรับวงกลมแนวโน้ม และแปลงพิกัดเป็นรูปขั้ว |
| `types.ts` | `ROLES`, `MACHINE_STATUSES`, `ALARM_STATUSES`, `MAINTENANCE_STATUSES` | ค่าคงที่ที่ต้องตรงกับ `CHECK` constraint ในฐานข้อมูล (มีเทสต์ยืนยัน) |

### การคุมสิทธิ์ 2 ชั้น

1. **UI** — `can(user.role, ...)` ซ่อน/ปิดปุ่มที่ผู้ใช้ไม่มีสิทธิ์
2. **Server** — ทุก Server Action เรียก `requireUser()` / `requireAdmin()` / `requireEditor()` ก่อนเขียน DB
3. **ฐานข้อมูล** — RLS policy บนทุกตาราง ตรวจซ้ำอีกชั้นที่ตัว Postgres

## Getting Started (Local)

```bash
npm install
cp .env.example .env.local   # ใส่ค่าจาก Supabase Dashboard > API
npm run dev                  # http://localhost:3000
```

### ตัวแปรสภาพแวดล้อม

| ตัวแปร | จำเป็น | ที่มา | ใช้ทำอะไร |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API | URL ของโปรเจกต์ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Project Settings → API | key สำหรับฝั่ง browser (ปลอดภัยเมื่อเปิด RLS แล้ว) |
| `SUPABASE_SERVICE_ROLE_KEY` | ต้องมีถ้าจะใช้ฟีเจอร์รีเซ็ตรหัสผ่าน | Supabase → Project Settings → API → `service_role` | ให้ระบบตั้งรหัสผ่านใหม่ให้ผู้ใช้ได้โดยไม่ต้องส่งอีเมล **ห้ามหลุดออกจากเซิร์ฟเวอร์** |
| `NEXT_PUBLIC_APP_TIMEZONE` | ไม่บังคับ | ตั้งค่าเอง | เขตเวลาที่ใช้นับวันและแสดงผลวันที่ทั้งระบบ (ค่าเริ่มต้น `Asia/Bangkok`) เปลี่ยนค่าแล้วต้อง build ใหม่ |
| `RESET_CODE_PEPPER` | ไม่บังคับ | ตั้งเอง | ค่าลับที่ปนลงก่อน hash โค้ดรีเซ็ต ทำให้ hash ที่โดนเดามาล่วงหน้าใช้ไม่ได้ |
| `ALLOW_PUBLIC_SIGNUP` | ไม่บังคับ | ตั้งเอง | ตั้งเป็น `false` เพื่อปิดการสมัครสมาชิกสาธารณะ (ค่าเริ่มต้นคือเปิด) |

> **หมายเหตุเรื่อง Service Role Key:** ถ้าไม่ตั้ง ฟีเจอร์รีเซ็ตรหัสผ่าน (ทั้งแบบตั้งรหัสให้โดย Admin และแบบใส่โค้ดที่หน้า login)
> จะแจ้ง error ว่าไม่ได้ตั้งค่า และคอลัมน์อีเมลในหน้า `/admin/users` จะขึ้น `-` ส่วนฟีเจอร์อื่นยังทำงานปกติ
> ไฟล์ `src/utils/supabase/admin.ts` มี `import "server-only"` กันไม่ให้ key ถูกส่งไปฝั่ง browser
> และไฟล์ `.env*` ถูกบล็อกใน `.gitignore` (ยกเว้น `.env.example`)

### บัญชีทดสอบ (เวอร์ชันที่ deploy ไว้)

| บทบาท | อีเมล | เข้าเห็นอะไรได้ |
| --- | --- | --- |
| Admin | `thanakrit-na@rmutp.ac.th` | ทุกอย่าง รวมถึงจัดการเครื่องจักร ผู้ใช้ และ Audit Log |
| Technician | `thanakritnaphattalung@gmail.com` | ดูข้อมูล + เพิ่ม/แก้ Alarm และงานซ่อม (แก้เครื่องจักรไม่ได้) |
| Viewer | `phatasanun-p@rmutp.ac.th` | ดูอย่างเดียว |

> **รหัสผ่าน:** ผู้ประเมินกำหนดเอง — ทุกบัญชีสมัครผ่านหน้า `/login` และระบบนี้
> **ไม่ใช้อีเมล** จึงไม่ต้องยืนยันอีเมล (ตั้ง Confirm email = OFF ใน Supabase)

**กฎการจัดสรรสิทธิ์**
- บัญชี**แรกที่สมัคร** ได้ `admin` อัตโนมัติ (trigger `handle_new_user` ใน `supabase/schema.sql`)
- บัญชีถัดไปได้ `technician`
- Admin เปลี่ยนบทบาทให้ได้ที่หน้า `/admin/users` (dropdown คอลัมน์ Role)
- ลบบัญชีทิ้งแล้วสมัครใหม่ บัญชีแรกจะได้ admin อีกครั้ง (ตาราง `profiles` ถูก `on delete cascade`)
- ระบบนี้ไม่มีการรีเซ็ตรหัสผ่านจากอีเมล ผู้ใช้ที่ลืมรหัสต้องขอ**รหัสรีเซ็ต 6 หลัก** จาก Admin
  (ดูหัวข้อ "รีเซ็ตรหัสผ่าน" ด้านล่าง)

### สร้าง Database

เปิดไฟล์ SQL ในโฟลเดอร์ `supabase/` ที่ Supabase Dashboard → **SQL Editor** → Run ตามลำดับ
(ทุกไฟล์รันซ้ำได้ ไม่ error):

1. `schema.sql` — ตารางหลัก + RLS policies + index + **ข้อมูลตัวอย่าง**
2. `migration_bonus.sql` — เพิ่ม Role `viewer`, ตาราง `audit_log` และ trigger บันทึก log
3. `sync_machine_status.sql` — trigger ซิงก์สถานะเครื่องจักรอัตโนมัติจาก Alarm
4. `fix_policy_recursion.sql` — แก้ปัญหา RLS infinite recursion (ถ้ายังไม่ได้แก้ในไฟล์ schema)
5. `reset_codes.sql` — ตาราง `password_reset_codes` สำหรับรีเซ็ตรหัสผ่านแบบไม่ต้องส่งอีเมล
6. `fix_missing_profiles.sql` — **รันเฉพาะกรณี** ที่บัญชีหายจากหน้า `/admin/users` (ดูหัวข้อด้านล่าง)

> **ลำดับสำคัญ:** ต้องรันตามลำดับ 1 → 4 เพราะไฟล์ที่ 4 จะลบ policy แบบเปิดกว้างจากไฟล์ที่ 1 ทิ้ง
> ถ้ารันผิดลำดับ `viewer` จะกลายเป็นผู้เขียนข้อมูลได้

### บัญชีหายจากหน้า /admin/users

อาการ: เข้า `/admin/users` แล้วเห็นผู้ใช้ไม่ครบ เช่น มีบัญชีในระบบ Auth 4 คน
แต่หน้าเว็บขึ้นแค่ 2 คน

สาเหตุ: บัญชีที่สมัคร **ก่อน** trigger `handle_new_user` ถูกสร้าง จะไม่มีแถวในตาราง
`profiles` และตารางนี้คือแหล่งข้อมูลที่หน้า `/admin/users` ดึงมาแสดง
(ถ้าใช้ query แบบ `join auth.users` กับ `profiles` บัญชีเหล่านี้จะถูกตัดทิ้งไปเงียบ ๆ)

วิธีแก้: รัน `supabase/fix_missing_profiles.sql` ใน SQL Editor
ไฟล์นี้จะแสดงรายชื่อที่ขาดก่อน แล้วสร้าง `profiles` ให้อัตโนมัติ (ถ้ายังไม่มี admin
เลย บัญชีแรกที่ซ่อมจะได้เป็น admin) รีเฟรชหน้า `/admin/users` หลังรัน

### รีเซ็ตรหัสผ่าน (ไม่ต้องส่งอีเมล)

ระบบนี้**ไม่ใช้อีเมล** ในการรีเซ็ตรหัสผ่าน เพราะ SMTP ของ Supabase ส่งอีเมลได้แค่
ผู้ดูแลโปรเจกต์เท่านั้น (ผู้ประเมินจะไม่ได้รับเมล) วิธีใช้งาน:

1. Admin เข้า `/admin/users` แล้วกด **ออกโค้ดรีเซ็ต** ตรงแถวของผู้ใช้
   ระบบจะแสดงตัวเลข 6 หลัก (หมดอายุใน 15 นาที ใช้ได้ครั้งเดียว)
2. ส่งโค้ดให้ผู้ใช้ (ทางโทรศัพท์/แชท ก็ได้ ไม่ต้องใช้อีเมล)
3. ผู้ใช้กด **ลืมรหัสผ่าน?** ที่หน้า login แล้วกรอก อีเมล + โค้ด + รหัสผ่านใหม่

การรีเซ็ตแบบนี้ปลอดภัยเพราะต้องมี Admin เป็นคนออกโค้ดก่อนเสมอ ผู้ใช้ทั่วไปเดาโค้ดไม่ได้
(กรอกผิดได้ไม่เกิน 5 ครั้ง แล้วโค้ดจะถูกเผา) ข้อความ error เป็นข้อความเดียวกันทุกกรณี
เพื่อไม่ให้เปิดเผยว่าอีเมลนั้นมีบัญชีอยู่จริงหรือไม่

> **ข้อมูลตัวอย่าง:** ท้าย `schema.sql` มีเครื่องจักร 6 เครื่อง, Alarm 24 รายการ (กระจายใน 14 วัน เพื่อให้กราฟบน Dashboard มีข้อมูล)
> และงานบำรุงรักษา 7 รายการ รันซ้ำได้ไม่ทำให้ข้อมูลซ้ำ ถ้าต้องการระบบว่างเปล่าให้ลบทั้งบล็อกนั้นทิ้ง

### สร้างผู้ใช้แรก

`Authentication → Users → Add user` (ผู้ใช้คนแรกจะได้เป็น Admin อัตโนมัติ)

## Testing

```bash
npm test          # รัน Unit Test ครั้งเดียว (Vitest)
npm run test:watch # รันแบบ watch ระหว่างพัฒนา
```

ครอบคลุม 80 เคส ด้วย Vitest:

- `tests/validation.test.ts` — ตรวจ Input Validation ของ Machine / Alarm / Maintenance (ช่องว่าง, สถานะ, ความยาว, รูปแบบวันที่, อีเมล/รหัสผ่าน), `sanitizeSearch()` กันการแทรกเงื่อนไขผ่าน PostgREST และ `isValidResetCode()` / `timingSafeEqual()` ของโค้ดรีเซ็ต
- `tests/lib.test.ts` — ตรวจ Export CSV (escape comma/quote, BOM สำหรับ Excel), ตารางสิทธิ์ตาม Role, และค่าคงที่สถานะที่ตรงกับฐานข้อมูล
- `tests/notifications.test.ts` — ตรวจกติกาการแจ้งเตือน (Alarm ค้าง, งานซ่อมเกินกำหนด) และการคำนวณข้อมูลกราฟแนวโน้ม

## CI / CD

- **GitHub Actions:** `npm ci → lint → test → build` อัตโนมัติทุกครั้งที่ push และ pull request (`.github/workflows/ci.yml`)
- **Vercel:** ระบบ deploy อัตโนมัติทุกครั้งที่ push ขึ้น branch `main`

## การใช้งาน AI ในการพัฒนา

โปรเจกต์นี้พัฒนาโดยใช้ AI ช่วยในทุกขั้นตอนตามที่ใบงานกำหนด:

- **วิเคราะห์ Requirement:** ให้ AI อ่าน PDF ใบงาน สรุปขอบเขตงาน เทคโนโลยีที่ต้องใช้ และเกณฑ์การให้คะแนน
- **ออกแบบ Database:** AI เขียน SQL schema (ตาราง profiles, machines, alarms, maintenance_records) พร้อม RLS policies ตามบทบาท Admin / Technician / Viewer
- **เขียน Source Code:** ให้ AI เขียนโค้ด Next.js 16 (App Router + Server Actions + Supabase) ทั้งระบบ Auth, CRUD, Search/Filter, Dashboard และหน้า Admin
- **สร้าง UI/UX:** ใช้ Tailwind CSS ทำ UI ส่วนใหญ่ผ่านการสั่งงานด้วย AI
- **เขียน SQL:** มีการปรับ schema SQL หลายรอบ เพื่อให้รันซ้ำได้โดยไม่ error (DROP IF EXISTS)
- **Debug และแก้ Error:** AI วินิจฉัย error จาก Supabase (policy ผิด, syntax error), ปัญหาชื่อโฟลเดอร์ npm, breaking changes ของ Next.js 16
- **สร้าง Test:** ใช้ AI ช่วย Refactor logic ตรวจสอบข้อมูลออกมาเป็นฟังก์ชันบริสุทธิ์ (`src/lib/validation.ts`, `src/lib/permissions.ts`, `src/lib/notifications.ts`, `src/lib/analytics.ts`) แล้วเขียน Unit Test ด้วย Vitest พร้อมต่อเข้า GitHub Actions
- **ปรับปรุงโปรแกรมม:** ใช้ AI รีวิวโค้ดเดิมแล้วแยกส่วนที่ซ้ำซ้อนออกมาใช้ร่วมกัน ลดความซ้ำซอนของ validation ใน Server Actions
- **Deploy:** ใช้ AI สั่งงานผ่าน CLI เพื่อ push GitHub และ deploy ขึ้น Vercel

- [GitHub Actions](https://github.com/thanakrit-na-bit/Web-App/actions) — ดูผล lint/test/build ของ commit ล่าสุด
- **AI Usage Report:** [`docs/AI_USAGE_REPORT.md`](docs/AI_USAGE_REPORT.md)

## Security

| หัวข้อ | วิธีที่ใช้ |
| --- | --- |
| การแทรกเงื่อนไขผ่าน Search | `sanitizeSearch()` escape อักขระ `% _ , . ( ) * ' " =` ก่อนประกอบเป็น PostgREST `.or()` |
| การสมัครสมาชิกแย่งสิทธิ์ Admin | trigger `handle_new_user()` ใช้ `pg_advisory_xact_lock` ให้มีผู้ดูแลคนแรกเพียงคนเดียวแม้สมัครพร้อมกัน |
| ปิดการสมัครสมาชิกสาธารณะ | ตั้ง `ALLOW_PUBLIC_SIGNUP=false` ได้ (ค่าเริ่มต้นเปิด เพื่อให้ผู้ประเมินสมัครบัญชีทดสอบได้) |
| ตัวช่วยอ่านบทบาท | `current_user_role()` revoke `execute` จาก `public`/`anon` เหลือเฉพาะ `authenticated` กันเรียกจาก anon |
| RLS แบบเปิดกว้าง | `fix_policy_recursion.sql` ลบ policy เดิมก่อนสร้าง policy ใหม่ — **ต้องรันเป็นไฟล์สุดท้าย** |
| โหลดบทบาทผิดพลาด | `getCurrentUser()` คืน `viewer` (สิทธิ์ต่ำสุด) เมื่ออ่าน role ไม่ได้ แทนที่จะเปิดสิทธิ์ |
| Admin คนสุดท้ายถูกลดสิทธิ์ | `updateUserRole` ปฏิเสธถ้าจะเหลือ Admin 0 คน |
| Service Role Key | `src/utils/supabase/admin.ts` มี `import "server-only"` และไม่เคยถูก commit (`.gitignore` บล็อก `.env*`) |
| Export CSV | จำกัด 10,000 แถวต่อครั้งและ sanitize คำค้นก่อน query |
| ช่วงวันที่ของกราฟ | `fetchAlarmTrend` clamp ค่า `days` ไว้ระหว่าง 1–365 |
| รีเซ็ตรหัสผ่าน | ต้องมีโค้ดจาก Admin เท่านั้น — ใช้ครั้งเดียว หมดอายุ 15 นาที ผิดได้ 5 ครั้งแล้วเผาโค้ด |
| การเดาโค้ดรีเซ็ต | เทียบด้วย `timingSafeEqual()` (ใช้เวลาคงที่) และข้อความ error เป็นข้อความเดียวกันทุกกรณี ไม่บอกว่าอีเมลมีอยู่จริง |
| โค้ดรีเซ็ตหลุดรั่ว | `password_reset_codes` เปิด RLS และไม่มี policy สำหรับ insert/update — เข้าถึงได้เฉพาะ Server Action ที่ใช้ service role key |
| โค้ดรีเซ็ตหลุดรั่ว | เก็บเป็น SHA-256 hash ไม่เก็บโค้ดจริง + ปน `RESET_CODE_PEPPER` — ฐานข้อมูลรั่วก็เอาโค้ดไปใช้รีเซ็ตไม่ได้ |
| โค้ดรีเซ็ตซ้ำ | `code_hash` มี `unique` constraint + สุ่มด้วย `crypto.randomInt()` (ไม่ใช่ `Math.random`) และลองใหม่เมื่อชน |

## Deployed

- **Vercel:** https://alarm-maint-app.vercel.app
- **GitHub:** https://github.com/thanakrit-na-bit/Web-App

## Database Structure

### ตารางหลัก

**`profiles`** — เชื่อมกับ `auth.users` (1:1)

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| `id` | uuid (PK) | อ้างอิง `auth.users.id` |
| `full_name` | text | ชื่อที่แสดงในระบบ |
| `role` | text | `admin` / `technician` / `viewer` (default `technician`) |
| `created_at` | timestamptz | เวลาสร้าง |

สร้างแถวอัตโนมัติเมื่อมีผู้ใช้ใหม่ (trigger `on_auth_user_created`) โดยผู้ใช้คนแรกได้เป็น `admin`
(ถ้ายังไม่มีผู้ดูแลเลย ผู้สมัครคนถัดไปจะได้เป็น `admin` — ป้องกันระบบที่ไม่มีใครเข้าบริหารได้)

**`machines`**

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| `id` | uuid (PK) | gen_random_uuid() |
| `machine_id` | text (unique) | **ห้ามซ้ำ** เช่น `M-001` |
| `machine_name` | text | ชื่อเครื่องจักร |
| `machine_type` | text | ประเภทเครื่องจักร |
| `location` | text | ตำแหน่งในโรงงาน |
| `status` | text | `Running` / `Stop` / `Alarm` / `Maintenance` |
| `created_at`, `updated_at` | timestamptz | `updated_at` อัปเดตอัตโนมัติ (trigger) |

**`alarms`**

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `machine_id` | uuid (FK) | → `machines.id` (ON DELETE CASCADE) |
| `alarm_code` | text | เช่น `AL-101` |
| `alarm_description` | text | รายละเอียด Alarm |
| `occurred_at` | timestamptz | เวลาที่เกิดเหตุ |
| `cause` | text | สาเหตุ (nullable) |
| `status` | text | `Open` / `In Progress` / `Closed` |
| `created_by` | uuid (FK) | → `auth.users.id` |
| `created_at` | timestamptz | |

**`maintenance_records`**

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `machine_id` | uuid (FK) | → `machines.id` (ON DELETE CASCADE) |
| `maintenance_type` | text | ประเภทงานซ่อม |
| `problem` | text | ปัญหาที่พบ |
| `action_taken` | text | การแก้ไข |
| `technician` | text | ช่างผู้ซ่อม (nullable) |
| `maintenance_date` | date | วันที่ทำบำรุงรักษา |
| `status` | text | `Scheduled` / `In Progress` / `Completed` / `Waiting Part` |
| `created_at` | timestamptz | |

### ตารางเสริม (โบนัส)

**`audit_log`** — บันทึกทุกการเพิ่ม/แก้ไข/ลบ (trigger `log_audit_event`)
คอลัมน์: `id`, `user_email`, `action` (`INSERT`/`UPDATE`/`DELETE`), `target_type`, `target_id`, `details`, `created_at`

**`password_reset_codes`** — โค้ดรีเซ็ตรหัสผ่านที่ Admin ออกให้ (ไม่ใช้อีเมล) ดู `supabase/reset_codes.sql`

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| `id` | uuid (PK) | |
| `user_id` | uuid (FK) | → `auth.users.id` (ON DELETE CASCADE) |
| `email` | text | อีเมลเจ้าของบัญชี ใช้ค้นตอนรีเซ็ตโดยไม่ต้อง scan `auth.users` |
| `code_hash` | text (**unique**) | SHA-256 ของโค้ด 6 หลัก (ปน `RESET_CODE_PEPPER`) — **ไม่เก็บโค้ดจริง** |
| `expires_at` | timestamptz | หมดอายุใน 15 นาที |
| `used_at` | timestamptz | เวลาที่ถูกใช้/เผา ถ้า `NULL` = ยังใช้ได้ |
| `attempts` | integer | จำนวนครั้งที่กรอกผิด ครบ 5 ครั้งแล้วเผาโค้ด |
| `created_by` | uuid (FK) | Admin ผู้ออกโค้ด |
| `created_at` | timestamptz | |

### ความสัมพันธ์

```
auth.users 1──1 profiles
machines 1──* alarms
machines 1──* maintenance_records
auth.users 1──* password_reset_codes
```

### Row Level Security

| ตาราง | Admin | Technician | Viewer |
| --- | --- | --- | --- |
| `machines` | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน | อ่าน |
| `alarms` | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน |
| `maintenance_records` | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน |
| `profiles` | อ่านทั้งหมด/แก้ Role | อ่านของตัวเอง | อ่านของตัวเอง |
| `audit_log` | อ่าน | ไม่ได้ | ไม่ได้ |
| `password_reset_codes` | อ่าน | ไม่ได้ | ไม่ได้ |

รายละเอียดเพิ่มเติมดูที่ `supabase/schema.sql`, `supabase/migration_bonus.sql` และ `supabase/reset_codes.sql`

> **ลำดับสำคัญ:** ถ้ารัน `schema.sql` แล้วไม่ได้รัน `fix_policy_recursion.sql` ต่อ ระบบจะยังมี policy แบบเปิดกว้าง
> ที่อนุญาตให้ทุก Role (รวมถึง Viewer) เขียนข้อมูลได้ ตามตารางด้านบนต้องรันให้ครบทั้ง 4 ไฟล์ตามลำดับ