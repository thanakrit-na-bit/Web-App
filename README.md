# Alarm & Maintenance Management System

ระบบจัดการเครื่องจักร แจ้งเตือน (Alarm) และงานบำรุงรักษา (Maintenance) สำหรับรายวิชา Programming in Automation Systems

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + Tailwind CSS + TypeScript
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **CI/CD:** GitHub Actions + Vercel
- **Version Control:** GitHub

## Features

- Login / Logout ด้วย Supabase Auth
- 2 บทบาท: **Admin** และ **Technician**
- RLS ตามบทบาท (Admin อ่าน/เขียนได้ทุกแถว, Technician อ่านได้และเขียนเฉพาะงานที่ได้รับมอบหมาย)
- จัดการ **Machine** (CRUD: ชื่อ, ประเภท, สถานะ, วันที่ติดตั้ง)
- จัดการ **Alarm** (CRUD: เชื่อมโยงเครื่องจักร, ระดับความรุนแรง, สถานะ, หมายเหตุ)
- จัดการ **Maintenance** (CRUD: ประเภทงาน, ผู้รับผิดชอบ, กำหนดการ, ผลการซ่อม)
- Search & Filter (ค้นหา + กรองตามสถานะ/ระดับ อย่างน้อย 2 เงื่อนไข)
- Dashboard สรุปยอดรวม (เครื่องจักร, แจ้งเตือนที่ค้าง, งานบำรุงรักษา)
- หน้า Admin จัดการบทบาทผู้ใช้ (โบนัส)
- Input Validation ทั้งฝั่ง client และ server

## Project Structure

```
alarm-maint-app/
├── src/
│   ├── app/
│   │   ├── (app)/          # หน้าหลัง login (dashboard, machines, alarms, maintenance, admin)
│   │   ├── (auth)/login/   # หน้าเข้าสู่ระบบ
│   │   └── actions/        # Server Actions
│   ├── components/         # UI components
│   ├── lib/                # types & utilities
│   ├── proxy.ts            # Middleware (Next.js 16)
│   └── utils/supabase/     # client / server / middleware helpers
├── supabase/schema.sql     # Database schema + RLS policies
└── .github/workflows/ci.yml
```

## Getting Started (Local)

```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

### สร้าง Database

เปิด `supabase/schema.sql` ที่ Supabase Dashboard → **SQL Editor** → Run (รันซ้ำได้)

### สร้างผู้ใช้แรก

`Authentication → Users → Add user` (ผู้ใช้คนแรกจะได้เป็น Admin อัตโนมัติ)

## CI / CD

- **GitHub Actions:** `install → lint → build` อัตโนมัติทุกครั้งที่ push (`.github/workflows/ci.yml`)
- **Vercel:** ระบบ deploy อัตโนมัติทุกครั้งที่ push ขึ้น branch `main`

## การใช้งาน AI ในการพัฒนา

โปรเจกต์นี้พัฒนาโดยใช้ AI ช่วยในทุกขั้นตอนตามที่ใบงานกำหนด:

- **วิเคราะห์ Requirement:** ให้ AI อ่าน PDF ใบงาน สรุปขอบเขตงาน เทคโนโลยีที่ต้องใช้ และเกณฑ์การให้คะแนน
- **ออกแบบ Database:** AI เขียน SQL schema (ตาราง profiles, machines, alarms, maintenance_records) พร้อม RLS policies ตามบทบาท Admin / Technician
- **เขียน Source Code:** ให้ AI เขียนโค้ด Next.js 16 (App Router + Server Actions + Supabase) ทั้งระบบ Auth, CRUD, Search/Filter, Dashboard และหน้า Admin
- **สร้าง UI/UX:** ใช้ Tailwind CSS ทำ UI ส่วนใหญ่ผ่านการสั่งงานด้วย AI
- **เขียน SQL:** มีการปรับ schema SQL หลายรอบ เพื่อให้รันซ้ำได้โดยไม่ error (DROP IF EXISTS)
- **Debug และแก้ Error:** AI วินิจฉัย error จาก Supabase (policy ผิด, syntax error), ปัญหาชื่อโฟลเดอร์ npm, breaking changes ของ Next.js 16
- **Deploy:** ใช้ AI สั่งงานผ่าน CLI เพื่อ push GitHub และ deploy ขึ้น Vercel

## Deployed

- **Vercel:** https://alarm-maint-app.vercel.app
- **GitHub:** https://github.com/thanakrit-na-bit/Web-App

## Supabase Schema

ตาราง: `profiles`, `machines`, `alarms`, `maintenance_records` — รายละเอียดใน `supabase/schema.sql`