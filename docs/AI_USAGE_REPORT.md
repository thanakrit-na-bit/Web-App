# รายงานการใช้ AI ในการพัฒนา (AI Usage Report)

**โปรเจกต์:** Alarm & Maintenance Management System
**รายวิชา:** Programming in Automation Systems
**เครื่องมือ AI ที่ใช้:** AI Coding Assistant ผ่าน CLI (agentic coding) — ใช้ในทุกขั้นตอนตั้งแต่วิเคราะห์ใบงานจนถึง Deploy

---

## 1. ภาพรวม

พัฒนาแบบ Incremental โดยให้ AI ช่วยอ่านใบงาน → ออกแบบ → เขียนโค้ด → ทดสอบ → Debug → Deploy
มีการ commit แยกตามหน้าที่ (feature-by-feature) เพื่อให้เห็นประวัติการพัฒนาชัดเจน
ดูประวัติทั้งหมดได้ที่ `git log --oneline`

## 2. ตารางสรุป: AI ช่วยอะไรในแต่ละขั้นตอน

| ขั้นตอน (ตามข้อ 4 ของใบงาน) | สิ่งที่ AI ช่วย | ผลลัพธ์ในระบบ |
| --- | --- | --- |
| วิเคราะห์ Requirement | อ่าน PDF ใบงาน แยกหัวข้อ 3.1–3.12, เกณฑ์การให้คะแนน และตัวอย่าง Change Request ออกมาเป็นรายการงาน | ขอบเขตงาน, ตารางฟีเจอร์ใน README |
| ออกแบบ Database | ออกแบบตาราง + คีย์ + ความสัมพันธ์ (ER) + RLS policies + trigger | `supabase/schema.sql`, `supabase/migration_bonus.sql` |
| เขียน Source Code | สร้างโครงสร้าง Next.js 16 (App Router, Server Actions), หน้าทั้งหมด, CRUD, Search/Filter, Dashboard | `src/app/**`, `src/components/**` |
| สร้าง UI/UX | ออกแบบ UI ด้วย Tailwind CSS 4 + Dark Mode + Responsive | `src/app/globals.css`, `src/components/app-shell.tsx` |
| เขียน SQL | เขียน/ปรับ SQL ให้รันซ้ำได้ (idempotent) และแก้ syntax/policy ที่ผิด | ไฟล์ทั้งหมดใน `supabase/` |
| Debug และแก้ Error | วินิจฉัย RLS infinite recursion, breaking changes ของ Next.js 16, error การยืนยันตัวตน/รีเซ็ตรหัสผ่าน | `supabase/fix_policy_recursion.sql`, commit `5240f39`, `3a7a9de` |
| สร้าง Test | ช่วย Refactor logic ให้เป็นฟังก์ชันบริสุทธิ์ที่ทดสอบได้ แล้วเขียน Unit Test ด้วย Vitest | `src/lib/validation.ts`, `src/lib/permissions.ts`, `src/lib/analytics.ts`, `src/lib/notifications.ts`, `tests/**` |
| ปรับปรุง/Refactor | รวม logic ที่ซ้ำซอนใน Server Actions เป็น module เดียว, รวมสิทธิ์ตาม Role เป็นตารางเดียว | `src/lib/permissions.ts` ใช้ร่วมกันทุกหน้าจอ |
| Deploy | ตั้งค่า GitHub Actions และ Vercel (ตรวจ build ผ่านบน CI ก่อน deploy) | `.github/workflows/ci.yml`, https://alarm-maint-app.vercel.app |

## 3. AI ช่วยวิเคราะห์และออกแบบอย่างไร

### 3.1 การแปลงใบงานเป็นงานที่ทำได้
AI ช่วยแยกข้อกำหนดในใบงานออกเป็นเช็กลิสต์ตรวจสอบว่า "ทำครบหรือยัง" โดยเทียบกับเกณฑ์การให้คะแนน เช่น
ตรวจพบว่า Workflow เดิมไม่มีขั้นตอน Run Test และไม่มีชุด Test เลย → แก้โดยเพิ่ม Vitest + 60 เคส
และเพิ่มขั้นตอน `npm test` ใน CI ให้ตรงตามข้อ 3.10

### 3.2 การออกแบบฐานข้อมูลและ RLS
AI เสนอการแยกหน้าที่ระหว่าง **RLS ฝั่งฐานข้อมูล** (บังคับสิทธิ์จริง แม้ถูกเรียก API ตรง ๆ ก็ทำไม่ได้)
กับ **ตารางสิทธิ์ฝั่ง UI** (`src/lib/permissions.ts` — ซ่อนปุ่มที่กดไม่ได้) และเลือกใช้แบบนี้เพื่อให้ตรงกับข้อ 3.1
ที่ระบุว่า "ระบบต้องควบคุมสิทธิ์การเข้าถึงตาม Role ทุกหน้าจอ"

นอกจากนี้ AI ช่วยวิเคราะห์ว่าการอ้างอิง `public.profiles` ภายใน policy ของ `profiles` เองทำให้เกิด
infinite recursion จึงแก้ด้วยฟังก์ชัน `security definer` (`supabase/fix_policy_recursion.sql`)

### 3.3 AI ช่วย Refactor เพื่อให้ทดสอบได้
ก่อน Refactor: การตรวจสอบข้อมูลอยู่ซ้ำ ๆ ใน `machines.ts`, `alarms.ts`, `maintenance.ts` (ประมาณ 100 บรรทัด)
และทดสอบไม่ได้เพราะผูกกับ Supabase/Session

หลัง Refactor (AI ช่วยวางแผนและลงมือแก้):

- ย้าย logic ตรวจข้อมูลไป `src/lib/validation.ts` → เป็นฟังก์ชันบริสุทธิ์ `validateMachine/validateAlarm/validateMaintenance`
- ย้ายตารางสิทธิ์ไป `src/lib/permissions.ts` → ใช้ร่วมกันทั้ง UI และ Server Actions
- เพิ่ม validation ที่เคยขาด (ความยาวข้อความ, รูปแบบวันที่, รูปแบบอีเมล, Machine ID ห้ามมีช่องว่าง)
- ผลลัพธ์: โค้ดสั้นลง ตรวจสอบง่ายขึ้น และทดสอบอัตโนมัติได้

### 3.4 AI ช่วยเขียนฟีเจอร์โบนัส
- **Notification:** AI ช่วยออกแบบกติกา (Alarm ค้างเกิน 24 ชม. = critical, งานซ่อมเลยกำหนด = warning/critical)
  แล้วแยกเป็น `src/lib/notifications.ts` (ตรวจสอบได้ด้วย Unit Test) กับ UI (`src/components/notification-bell.tsx`)
- **กราฟวิเคราะห์ Alarm:** AI เลือกเขียนกราฟด้วย SVG ล้วน ๆ แทน library ภายนอก
  เพื่อไม่เพิ่ม dependency และไม่ให้ชำหนัดกับ React 19 — ผลลัพธ์คือกราฟแท่ง 14 วัน แยกสีตามสถานะ
- **Responsive UI:** AI ช่วยแยก Shell เป็น Client Component และเพิ่ม Drawer สำหรับมือถือ

## 4. การตรวจสอบงานของ AI (ไม่ได้เชื่อ AI 100%)

ทุกครั้งหลัง AI แก้โค้ด จะรันคำสั่งตรวจสอบจริงเสมอ:

```bash
npm run lint    # ESLint (React Hooks, purity rules)
npm test        # Vitest 60 เคส
npm run build   # Next.js production build + TypeScript
```

ผลลัพธ์ ณ ปัจจุบัน: **lint ผ่าน / test ผ่าน 60 เคส / build ผ่าน** และ CI ทำงานเดียวกันนี้อัตโนมัติทุกครั้งที่ push
บน GitHub (สถานะตรวจสอบได้ที่แท็บ Actions ของ repository)

## 5. ข้อจำกัดและการตรวจสอบของมนุษย์

- **ความถูกต้องของข้อมูล:** SQL และโค้ดที่ AI สร้างต้องรันบน Supabase จริงและตรวจสอบกับข้อมูลจริงก่อนเสนออาจารย์
- **สิทธิ์ความปลอดภัย:** RLS และการตรวจสิทธิ์ซ้ำ ๆ สองชั้น (ฐานข้อมูล + UI) ต้องทดสอบด้วยบัญชีทดสอบจริงทุก Role
- **UI/UX:** AI ช่วยสร้างได้ แต่ผู้ใช้ต้องลองใช้จริงแล้วปรับตามความต้องการ
- **ข้อมูลตัวอย่าง:** ตัวอย่างการเขียน SQL อ้างอิงความรู้ของโมเดล จึงต้องทดสอบจริงทุกครั้ง (ซึ่งทำแล้วในรอบการ Debug หลายครั้ง)

## 6. สรุปผล

AI ถูกใช้เป็น "ผู้ช่วยพัฒนา" ไม่ใช่ตัวแทนการตรวจสอบ — ผลลัพธ์คือโค้ดที่ผ่าน lint, test และ build
พร้อมทั้งมีเอกสารและประวัติการพัฒนาครบถ้วนตามที่ใบงานกำหนด
