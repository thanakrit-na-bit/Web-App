# Alarm & Maintenance Management System

ระบบจัดการเครื่องจักร แจ้งเตือน (Alarm) และงานบำรุงรักษา (Maintenance) สำหรับรายวิชา Programming in Automation Systems

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + Tailwind CSS + TypeScript
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **CI/CD:** GitHub Actions + Vercel
- **Version Control:** GitHub

## Features

- Login / Logout ด้วย Supabase Auth
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
- **กราฟวิเคราะห์ Alarm 14 วันล่าสุด** (แยกสีตามสถานะ) — `src/components/alarm-trend-chart.tsx`
- **Notification** กระดิ่งแจ้งเตือน: Alarm ค้าง, งานซ่อมเกินกำหนด (มีจุดแดงบอกยังไม่อ่าน) — `src/lib/notifications.ts`
- Export CSV (เครื่องจักร / Alarm / Maintenance) ตามตัวกรองที่เลือก
- Audit Log บันทึกทุกการเพิ่ม/แก้ไข/ลบ (หน้า `/admin/audit`)
- หน้า Admin จัดการบทบาทผู้ใช้และรีเซ็ตรหัสผ่านให้ผู้ใช้ได้
- Input Validation ทั้งฝั่ง client และ server (ตรวจช่องว่าง, สถานะ, ความยาว, รูปแบบวันที่/อีเมล)
- Responsive UI (เมนู Drawer บนมือถือ) + Dark Mode + จดจำอีเมลไว้ในเครื่อง
- Unit Test 60 เคสด้วย Vitest (รันใน GitHub Actions ทุกครั้งที่ push)

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
│   │   ├── (auth)/login/   # หน้าเข้าสู่ระบบ
│   │   └── actions/        # Server Actions (ตรวจสิทธิ์ + validate ก่อนเขียน DB)
│   ├── components/         # UI components (app-shell, notification-bell, alarm-trend-chart)
│   ├── lib/                # types, validation, permissions, notifications, analytics, csv
│   ├── proxy.ts            # Middleware (Next.js 16)
│   └── utils/supabase/     # client / server / middleware helpers
├── docs/                   # เอกสารประกอบการส่งงาน (AI report, deliverables, change requests)
├── supabase/
│   ├── schema.sql              # ตารางหลัก + RLS policies
│   ├── migration_bonus.sql     # Role Viewer + ตาราง Audit Log + trigger บันทึก log
│   ├── sync_machine_status.sql # trigger ซิงก์สถานะเครื่องจักรจาก Alarm
│   └── fix_policy_recursion.sql# แก้ปัญหา RLS infinite recursion
├── tests/                  # Vitest unit tests
├── vitest.config.ts
└── .github/workflows/ci.yml
```

## Getting Started (Local)

```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

### สร้าง Database

เปิดไฟล์ SQL ในโฟลเดอร์ `supabase/` ที่ Supabase Dashboard → **SQL Editor** → Run ตามลำดับ
(ทุกไฟล์รันซ้ำได้ ไม่ error):

1. `schema.sql` — ตารางหลัก + RLS policies
2. `migration_bonus.sql` — เพิ่ม Role `viewer`, ตาราง `audit_log` และ trigger บันทึก log
3. `sync_machine_status.sql` — trigger ซิงก์สถานะเครื่องจักรอัตโนมัติจาก Alarm
4. `fix_policy_recursion.sql` — แก้ปัญหา RLS infinite recursion (ถ้ายังไม่ได้แก้ในไฟล์ schema)

### สร้างผู้ใช้แรก

`Authentication → Users → Add user` (ผู้ใช้คนแรกจะได้เป็น Admin อัตโนมัติ)

## Testing

```bash
npm test          # รัน Unit Test ครั้งเดียว (Vitest)
npm run test:watch # รันแบบ watch ระหว่างพัฒนา
```

ครอบคลุม 60 เคส ด้วย Vitest:

- `tests/validation.test.ts` — ตรวจ Input Validation ของ Machine / Alarm / Maintenance (ช่องว่าง, สถานะ, ความยาว, รูปแบบวันที่, อีเมล/รหัสผ่าน)
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

> รายงานฉบับเต็ม: [`docs/AI_USAGE_REPORT.md`](docs/AI_USAGE_REPORT.md)

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

### ความสัมพันธ์

```
auth.users 1──1 profiles
machines 1──* alarms
machines 1──* maintenance_records
```

### Row Level Security

| ตาราง | Admin | Technician | Viewer |
| --- | --- | --- | --- |
| `machines` | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน | อ่าน |
| `alarms` | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน |
| `maintenance_records` | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน/เพิ่ม/แก้ไข/ลบ | อ่าน |
| `profiles` | อ่านทั้งหมด/แก้ Role | อ่านของตัวเอง | อ่านของตัวเอง |
| `audit_log` | อ่าน | ไม่ได้ | ไม่ได้ |

รายละเอียดเพิ่มเติมดูที่ `supabase/schema.sql` และ `supabase/migration_bonus.sql`