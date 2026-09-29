import { chromium } from "playwright";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const win = (p) => p.replace(/\\/g, "/");

const SHOTS_DIR = win(resolve(REPO, "docs", "screenshots"));
const OUT_DIR = win(resolve(REPO, "docs"));
const FONT_DIR = win(resolve(HERE, "fonts"));
const HTML_PATH = win(resolve(HERE, "report.html"));

const GITHUB = "https://github.com/thanakrit-na-bit/Web-App";
const VERGEL = "https://alarm-maint-app.vercel.app";
const TEST_COUNT = 107;

const shots = [
  ["01-login.png", "ภาพที่ 1 — หน้าเข้าสู่ระบบ (Login) ด้วย Supabase Authentication"],
  ["02-dashboard.png", "ภาพที่ 2 — Dashboard: สถิติสรุป + กราฟแนวโน้ม Alarm 14 วัน (สลับแท่ง/เส้น/วงกลมได้)"],
  ["03-machines.png", "ภาพที่ 3 — Machine Master: จัดการ/ค้นหาเครื่องจักร สถานะ Running / Stop / Alarm / Maintenance"],
  ["04-machine-history.png", "ภาพที่ 4 — Machine History: ประวัติ Alarm และงานซ่อมรายเครื่อง (ฟีเจอร์โบนัส)"],
  ["05-alarms.png", "ภาพที่ 5 — Alarm Record: ขึ้นทะเบียน Alarm, Search/Filter, เปลี่ยนสถานะ Open / In Progress / Closed"],
  ["06-maintenance.png", "ภาพที่ 6 — Maintenance Record: กำหนดงานซ่อม ระบุช่าง/ปัญหาพร้อมสถานะ Waiting Part (Change Request)"],
  ["07-admin-users.png", "ภาพที่ 7 — การจัดการผู้ใช้และสิทธิ์ตาม Role (Admin / Technician / Viewer)"],
  ["08-audit-log.png", "ภาพที่ 8 — Audit Log: บันทึกการแก้ไขข้อมูลทุกครั้ง (ฟีเจอร์โบนัส)"],
  ["09-dark-mode.png", "ภาพที่ 9 — Dark Mode: ธีมมืดทั้งระบบ (ฟีเจอร์โบนัส)"],
  ["10-mobile.png", "ภาพที่ 10 — Responsive UI: เมนู Drawer บนมือถือ"],
  ["11-forgot-password.png", "ภาพที่ 11 — ลืมรหัสผ่าน / รีเซ็ตรหัสผ่าน (Forgot Password)"],
];

// ---- เรขาคณิตของกระดาษ A4 (หน่วย pt) ----
const CONTENT_W = 515.9; // 595.28 - 2*14mm
const MAX_H_FIRST = 540; // ภาพแรก (มีหัวข้อกำกับอยู่หน้าเดียวกัน)
const MAX_H_REST = 620; // ภาพที่เหลือ

function pngSize(file) {
  const b = readFileSync(`${SHOTS_DIR}/${file}`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const fig = shots
  .map(([f, cap], i) => {
    const { w: pxW, h: pxH } = pngSize(f);
    const dispW = Math.min(CONTENT_W, pxW * 0.75);
    const dispH = (pxH * dispW) / pxW;
    const maxH = i === 0 ? MAX_H_FIRST : MAX_H_REST;
    const n = Math.max(1, Math.ceil(dispH / maxH));
    const sliceH = dispH / n;
    const src = `file:///${SHOTS_DIR}/${f}`;

    let html = "";
    for (let s = 0; s < n; s++) {
      const label = n === 1 ? cap : `${cap} <span class="part">(ต่อ ${s + 1}/${n})</span>`;
      html += `
  <figure class="shot" style="${i === 0 && s === 0 ? "" : "break-before: page; "}">
    <div class="clip" style="height: ${sliceH.toFixed(1)}pt;">
      <img src="${src}" alt="${cap}" style="width: ${dispW.toFixed(1)}pt; margin-top: ${(-s * sliceH).toFixed(1)}pt;" />
    </div>
    <figcaption><b>${label}</b><br/><span class="src">แหล่งที่มา: ${VERGEL} (เข้าสู่ระบบด้วยบัญชีจริง)</span></figcaption>
  </figure>`;
    }
    return html;
  })
  .join("\n");

const face = (file, weight, style) => `@font-face {
  font-family: "THSarabunPSK";
  src: url("file:///${FONT_DIR}/${encodeURIComponent(file)}") format("truetype");
  font-weight: ${weight};
  font-style: ${style};
}`;

const FONTS_CSS = [
  face("THSarabunPSK Regular.ttf", 400, "normal"),
  face("THSarabunPSK Bold.ttf", 700, "normal"),
  face("THSarabunPSK Italic.ttf", 400, "italic"),
  face("THSarabunPSK BoldItalic.ttf", 700, "italic"),
].join("\n");

const aiRows = [
  [
    "1. วิเคราะห์ Requirement",
    "อ่านใบงานแล้วแยกหัวข้อ 3.1–3.12, เกณฑ์การให้คะแนน และตัวอย่าง Change Request ออกมาเป็นเช็กลิสต์งานที่ตรวจสอบได้",
    "README ระบุฟีเจอร์ครบทุกข้อ · ตรวจพบว่า Workflow เดิมไม่มีขั้นตอน Run Test → เพิ่ม Vitest และ <code>npm test</code> เข้า CI ตามข้อ 3.10",
  ],
  [
    "2. ออกแบบ Database",
    "ออกแบบตาราง คีย์ ความสัมพันธ์ (ER) พร้อม RLS Policies และ Audit Trigger โดยเลือกบังคับสิทธิ์ 2 ชั้น: RLS ฝั่งฐานข้อมูล + ตารางสิทธิ์ฝั่ง UI",
    "<code>supabase/schema.sql</code>, <code>supabase/migration_bonus.sql</code> — ตาราง profiles, machines, alarms, maintenance_records พร้อม RLS",
  ],
  [
    "3. เขียน Source Code",
    "สร้างโครงสร้าง Next.js 16 (App Router, Server Actions) หน้าจอทั้งหมด CRUD, Search/Filter และ Dashboard",
    "<code>src/app/**</code>, <code>src/components/**</code> — ผ่าน <code>npm run build</code> (TypeScript + production build)",
  ],
  [
    "4. สร้าง UI/UX",
    "ออกแบบ UI ด้วย Tailwind CSS 4 พร้อมธีมมืด (Dark Mode) และ Responsive สำหรับมือถือ",
    "<code>src/app/globals.css</code>, <code>src/components/app-shell.tsx</code> — ภาพที่ 9 และ 10",
  ],
  [
    "5. เขียน SQL",
    "เขียนและปรับ SQL ให้รันซ้ำได้ (idempotent) พร้อมแก้ syntax และ policy ที่ผิด",
    "ไฟล์ทั้งหมดใน <code>supabase/</code> — รันซ้ำบนโปรเจกต์จริงได้",
  ],
  [
    "6. Debug และแก้ Error",
    "วินิจฉัย RLS infinite recursion, breaking changes ของ Next.js 16 และ error การยืนยันตัวตน/รีเซ็ตรหัสผ่าน",
    "<code>supabase/fix_policy_recursion.sql</code> (ใช้ฟังก์ชัน <code>security definer</code>) — commit <code>5240f39</code>, <code>3a7a9de</code>",
  ],
  [
    "7. สร้าง Test",
    "ช่วย Refactor logic ให้เป็นฟังก์ชันบริสุทธิ์ที่ทดสอบได้ แล้วเขียน Unit Test ด้วย Vitest พร้อมเติม validation ที่เคยขาด",
    `<code>tests/**</code> — ผ่าน <b>${TEST_COUNT} เคส</b> (validation, permissions, analytics, notifications, time)`,
  ],
  [
    "8. ปรับปรุงและ Refactor",
    "รวม logic ที่ซ้ำซอนใน Server Actions เป็น module เดียว และรวมสิทธิ์ตาม Role เป็นตารางเดียวที่ใช้ร่วมกันทุกหน้าจอ",
    "<code>src/lib/permissions.ts</code> — โค้ดสั้นลง ตรวจสอบง่ายขึ้น และทดสอบอัตโนมัติได้",
  ],
];

const aiTable = `
<table class="ai">
  <colgroup><col style="width:20%"/><col style="width:42%"/><col style="width:38%"/></colgroup>
  <thead>
    <tr><th>ขั้นตอน<br/><span style="font-weight:400">(ตามข้อ 4 ของใบงาน)</span></th><th>สิ่งที่ AI ช่วย</th><th>ผลลัพธ์ที่ตรวจสอบได้</th></tr>
  </thead>
  <tbody>
    ${aiRows
      .map(
        ([a, b, c], i) => `    <tr><td class="step"><span class="b">${i + 1}</span>${a.replace(/^\d+\.\s*/, "")}</td><td>${b}</td><td>${c}</td></tr>`
      )
      .join("\n")}
  </tbody>
</table>`;

const reqTable = (rows) => `
<table class="req">
  <colgroup><col style="width:30%"/><col style="width:70%"/></colgroup>
  <tbody>
    ${rows
      .map(
        ([no, name, detail]) =>
          `    <tr><td class="step"><span class="b">${no}</span>${name}</td><td>${detail}</td></tr>`
      )
      .join("\n")}
  </tbody>
</table>`;

const funcRows = [
  ["3.1", "Authentication &amp; Role", "Login / Logout ด้วย Supabase Auth · 3 roles (Admin / Technician / Viewer) · บังคับสิทธิ์ 2 ชั้น คือตารางสิทธิ์ฝั่ง UI และ RLS ฝั่งฐานข้อมูล"],
  ["3.2", "Machine Master", "CRUD เครื่องจักร (Machine ID, Name, Type, Location) · สถานะ Running / Stop / Alarm / Maintenance"],
  ["3.3", "Alarm Record", "ขึ้นทะเบียน Alarm (Code, Description, Date/Time, Cause) · สถานะ Open / In Progress / Closed"],
  ["3.4", "Maintenance Record", "งานซ่อม (Type, Problem, Action Taken, Technician, Date) · สถานะ Waiting Part"],
  ["3.5", "Search &amp; Filter", "ค้นหาและกรองหลายเงื่อนไข: Machine, Status, Alarm Code, Technician และช่วงวันที่"],
  ["3.6", "Dashboard", "สถิติเครื่องจักรและงานทั้งหมด · กราฟแนวโน้ม Alarm 14 วัน (สลับแท่ง/เส้น/วงกลม) · แสดงเวลาเป็นเวลาประเทศไทย"],
  ["3.7", "Input Validation", `ตรวจสอบข้อมูลทุกแบบฟอร์ม · Machine ID ห้ามซ้ำ · แจ้งเตือนอินไลน์ — ครอบคลุมด้วย Unit Test <b>${TEST_COUNT} เคส</b>`],
];

const toolRows = [
  ["3.8", "Database", "Supabase (PostgreSQL) — ตาราง <code>profiles</code>, <code>machines</code>, <code>alarms</code>, <code>maintenance_records</code> พร้อม RLS Policies และ Audit Trigger → <code>supabase/schema.sql</code>"],
  ["3.9", "GitHub", `เก็บ Source Code บน GitHub · มีประวัติ commit แยกตามหน้าที่การพัฒนา · มี README → <a href="${GITHUB}">${GITHUB}</a>`],
  ["3.10", "GitHub Actions", "Workflow เดียว ตรวจสอบอัตโนมัติ Install → Build → Run Test ทุกครั้งที่ push → <code>.github/workflows/ci.yml</code>"],
  ["3.11", "Deployment", `Deploy บน Vercel ใช้งานได้จริงทุก push → <a href="${VERGEL}">${VERGEL}</a>`],
  ["3.12", "README", "อธิบายโครงการ ฟีเจอร์ เทคโนโลยีที่ใช้ โครงสร้างฐานข้อมูล วิธีติดตั้งและใช้งาน Vercel URL และรายละเอียดการใช้ AI → <code>README.md</code>"],
];

const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<style>
${FONTS_CSS}

  @page { size: A4; margin: 16mm 14mm 15mm 14mm; }

  * { box-sizing: border-box; }

  :root {
    --navy: #0f2557;
    --blue: #1d4ed8;
    --ink: #1e293b;
    --muted: #64748b;
    --line: #cbd5e1;
    --soft: #f8fafc;
  }

  body {
    font-family: "THSarabunPSK", "Sarabun", "Leelawadee UI", Tahoma, sans-serif;
    font-size: 18px;
    line-height: 1.85;
    color: var(--ink);
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  p { margin: 0 0 10px; }

  code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 0.86em;
    background: #eef2f7;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 1px 5px;
    color: #0f2557;
    white-space: nowrap;
  }

  /* ---------- ปก ---------- */
  .cover {
    background: linear-gradient(135deg, #0b1c46 0%, #14337a 45%, #1d4ed8 100%);
    color: #ffffff;
    border-radius: 16px;
    padding: 40px 36px 34px;
    break-inside: avoid;
    break-after: page;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .cover::after {
    content: "";
    position: absolute;
    right: -60px; top: -60px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,.06);
  }
  .cover .eyebrow {
    display: inline-block;
    background: rgba(255,255,255,.16);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 999px;
    padding: 5px 16px;
    font-size: 15.5px;
    letter-spacing: .4px;
    margin-bottom: 16px;
  }
  .cover h1 { margin: 0 0 4px; font-size: 40px; line-height: 1.35; font-weight: 700; }
  .cover .sub { font-size: 22px; line-height: 1.6; opacity: .95; margin: 2px 0; }
  .cover .sub2 { font-size: 18.5px; line-height: 1.6; opacity: .82; margin: 4px 0 0; }
  .cover .tech {
    margin-top: 22px; font-size: 17px; line-height: 1.9;
    border-top: 1px solid rgba(255,255,255,.32); padding-top: 14px; opacity: .92;
  }
  .cover .tech b { opacity: 1; }

  .id-box {
    background: #ffffff; color: var(--navy);
    border-radius: 12px; padding: 16px 20px; margin-top: 22px;
    font-size: 19px; line-height: 1.9;
    box-shadow: 0 6px 20px rgba(15,37,87,.18);
  }
  .id-box .lbl { font-size: 17px; color: var(--muted); margin-bottom: 6px; letter-spacing: .3px; }
  .id-box .row { display: flex; align-items: baseline; gap: 10px; padding: 3px 0; }
  .id-box .n {
    display: inline-block; min-width: 26px; text-align: center;
    background: var(--blue); color: #fff; border-radius: 5px;
    font-size: 15.5px; padding: 1px 7px;
  }

  /* ---------- หัวข้อ ---------- */
  h2 {
    display: flex; align-items: flex-start; gap: 14px;
    color: var(--navy); font-size: 27px; line-height: 1.5;
    font-weight: 700; margin: 40px 0 16px;
    break-after: avoid; page-break-after: avoid;
  }
  h2 .n {
    flex: 0 0 auto;
    background: var(--blue); color: #fff;
    border-radius: 9px; min-width: 46px; height: 46px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-top: 3px;
  }
  h2 .t { flex: 1 1 auto; border-bottom: 2px solid #dbe3f5; padding-bottom: 8px; }

  h3 {
    color: #1e40af; font-size: 21px; line-height: 1.6;
    margin: 26px 0 8px; font-weight: 700;
    break-after: avoid; page-break-after: avoid;
  }

  .lead {
    background: linear-gradient(180deg, #f5f8ff 0%, #eef3ff 100%);
    border: 1px solid #d8e2f8; border-left: 5px solid var(--blue);
    border-radius: 10px; padding: 14px 20px;
    font-size: 18.5px; line-height: 1.85; color: #1e3a8a;
    margin: 0 0 20px;
  }
  .lead b { color: var(--navy); }

  /* ---------- ตาราง ---------- */
  table { border-collapse: collapse; width: 100%; font-size: 17.5px; line-height: 1.7; }
  td, th { border: 1px solid var(--line); padding: 9px 12px; vertical-align: top; text-align: left; }
  th { background: #dbe3fb; color: var(--navy); font-weight: 700; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  table.dl td:first-child { width: 30%; font-weight: 700; color: var(--navy); background: #f4f7fd; }

  table.ai { font-size: 16.5px; }
  table.ai th { background: var(--navy); color: #fff; text-align: center; font-size: 18px; }
  table.ai td.step { background: #eef3ff; font-weight: 700; color: var(--navy); }
  table.ai td.step .b {
    display: inline-block; min-width: 22px; text-align: center;
    background: var(--blue); color: #fff; border-radius: 4px;
    font-size: 14.5px; padding: 0 6px; margin-right: 6px;
  }
  table.ai thead { display: table-header-group; }
  table.ai tr { break-inside: avoid; page-break-inside: avoid; }

  table.req { width: 100%; border-collapse: collapse; margin: 14px 0 20px; font-size: 16px; }
  table.req th { background: var(--navy); color: #fff; text-align: center; font-size: 17px; padding: 10px; }
  table.req td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: top; line-height: 1.62; }
  table.req td.step { background: #eef3ff; font-weight: 700; color: var(--navy); }
  table.req td.step .b {
    display: inline-block; min-width: 26px; text-align: center;
    background: var(--blue); color: #fff; border-radius: 4px;
    font-size: 14.5px; padding: 0 6px; margin-right: 8px;
  }
  table.req tr { break-inside: avoid; page-break-inside: avoid; }

  /* ---------- รายการ ---------- */
  ul { margin: 8px 0 12px; padding-left: 26px; font-size: 18.5px; line-height: 1.9; }
  ul.twocol { columns: 2; column-gap: 32px; }
  ul.twocol li { break-inside: avoid; page-break-inside: avoid; }
  li { margin-bottom: 5px; orphans: 1; widows: 1; }
  li::marker { color: var(--blue); }

  .cmds {
    background: #0f172a; color: #e2e8f0;
    border-radius: 10px; padding: 14px 20px;
    font-size: 17.5px; line-height: 2;
  }
  .cmds div { white-space: nowrap; }
  .cmds .c { color: #7dd3fc; font-family: "Consolas", monospace; font-size: .92em; }
  .cmds .ok { color: #86efac; }

  a { color: var(--blue); text-decoration: none; word-break: break-all; }

  figure { margin: 0 0 16px; break-inside: avoid; page-break-inside: avoid; }
  figure .clip {
    overflow: hidden;
    border: 1px solid #cbd5e1; border-radius: 8px;
    background: #ffffff; line-height: 0;
  }
  figure .clip img { display: block; max-width: none; }
  figcaption { font-size: 17px; color: #334155; margin-top: 10px; line-height: 1.75; }
  figcaption .src { color: var(--muted); font-size: 16px; }
  figcaption .part { color: var(--blue); font-weight: 700; }

  .foot {
    margin-top: 30px; padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 15px; color: #94a3b8; text-align: center; line-height: 1.7;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="eyebrow">รายงานประกอบการส่งงาน · ส่วนที่ 5</div>
  <h1>Alarm &amp; Maintenance Management System</h1>
  <div class="sub">สิ่งที่ต้องส่ง — Deliverables &amp; Screenshots</div>
  <div class="sub2">รายวิชา Programming in Automation Systems<br/>(Automation Web Application ด้วย AI)</div>
  <div class="tech">
    <b>เทคโนโลยีที่ใช้:</b> Next.js 16 (App Router) &nbsp;•&nbsp; Tailwind CSS 4 &nbsp;•&nbsp; Supabase (PostgreSQL + Auth + RLS) &nbsp;•&nbsp; GitHub &nbsp;•&nbsp; GitHub Actions (CI) &nbsp;•&nbsp; Vercel &nbsp;•&nbsp; AI Coding Assistant
  </div>
  <div class="id-box">
    <div class="lbl">จัดทำโดย (กลุ่ม)</div>
    <div class="row"><span class="n">1</span><span>นายธนกฤต ณ. พัทลุง &nbsp;·&nbsp; รหัส 006-8</span></div>
    <div class="row"><span class="n">2</span><span>นายพรรษนันท์ เปี่ยมยานนท์ &nbsp;·&nbsp; รหัส 002-7</span></div>
    <div class="row"><span class="n">3</span><span>นางสาวกัญจนพร กระจาดแก้ว &nbsp;·&nbsp; รหัส 005-0</span></div>
  </div>
</div>

<h2><span class="n">1</span><span class="t">รายการสิ่งที่ส่ง (Deliverables) — ตามใบงานข้อ 5</span></h2>
<table class="dl">
  <tr><th style="width:34%">รายการ (ตามใบงานข้อ 5)</th><th>ตำแหน่ง / URL</th></tr>
  <tr><td>1. GitHub Repository URL</td><td><a href="${GITHUB}">${GITHUB}</a></td></tr>
  <tr><td>2. Vercel Deployment URL</td><td><a href="${VERGEL}">${VERGEL}</a> (ใช้งานได้จริง, Deploy อัตโนมัติทุก push)</td></tr>
  <tr><td>3. Supabase Database Schema</td><td><code>supabase/schema.sql</code>, <code>supabase/migration_bonus.sql</code>, <code>supabase/fix_policy_recursion.sql</code> — tables: <code>profiles</code>, <code>machines</code>, <code>alarms</code>, <code>maintenance_records</code> + RLS Policies + Audit Trigger</td></tr>
  <tr><td>4. README</td><td><code>README.md</code> (พร้อม documentation ในโฟลเดอร์ <code>docs/</code>)</td></tr>
  <tr><td>5. Screenshot หน้าจอระบบ</td><td>11 ภาพ (แนบเป็นภาพที่ 1–11 ท้ายรายงานนี้) — ถ่ายจากเว็บจริงบน Vercel</td></tr>
  <tr><td>6. รายงานสั้น ๆ เกี่ยวกับการใช้ AI</td><td><b>หัวข้อที่ 3 ด้านล่าง</b> + <code>docs/AI_USAGE_REPORT.md</code> (ฉบับละเอียด)</td></tr>
</table>

<h2><span class="n">2</span><span class="t">สรุปฟังก์ชันของระบบตามใบงาน (ข้อ 3.1–3.12)</span></h2>
<div class="lead">ระบบตอบครบทุกข้อของใบงาน (ข้อ 3.1–3.12) ตรงตามเกณฑ์การให้คะแนน 100 คะแนนในใบงานข้อ 6</div>

<h3>2.1 ฟีเจอร์ของระบบ (ข้อ 3.1–3.7)</h3>
${reqTable(funcRows)}

<h3>2.2 ฐานข้อมูลและเครื่องมือ (ข้อ 3.8–3.12)</h3>
${reqTable(toolRows)}

<h3>2.3 ฟีเจอร์โบนัส (ข้อ 7 ของใบงาน)</h3>
<ul class="twocol">
  <li><b>Role Viewer</b> เพิ่มเข้ามานอกเหนือจาก Admin / Technician ที่ใบงานกำหนด</li>
  <li><b>Dashboard กราฟวิเคราะห์</b> ปัจจุบัน Alarm ย้อนหลัง 14 วัน (สลับมุมมองแท่ง/เส้น/วงกลมได้)</li>
  <li><b>Machine History</b> ดูประวัติ Alarm และงานซ่อมรายเครื่องจักร</li>
  <li><b>Filter ขั้นสูง</b> หลายเงื่อนไขพร้อมกัน พร้อม Export เป็น CSV</li>
  <li><b>Notification</b> แจ้งเตือนเมื่อมี Alarm ใหม่ (ผ่านหน้า Dashboard)</li>
  <li><b>Audit Log</b> บันทึกทุกการแก้ไขข้อมูลในระบบ</li>
  <li><b>Responsive UI / Dark Mode</b> ใช้งานบนมือถือได้ และสลับธีมมืดได้ (ภาพที่ 9 และ 10)</li>
  <li><b>สถานะ Waiting Part</b> ตามตัวอย่างใน Change Request ของใบงาน</li>
</ul>

<h2 style="break-before: page; page-break-before: always;"><span class="n">3</span><span class="t">รายงานสั้น ๆ เกี่ยวกับการใช้ AI ในการพัฒนา</span></h2>
<div class="lead">
  <b>ข้อ 5.6 ของใบงาน (สิ่งที่ต้องส่ง)</b> — และตรงกับ <b>ข้อ 4 การใช้ AI</b> ที่กำหนดให้ใช้ AI ช่วยในทุกขั้นตอนของการพัฒนา
</div>

<p>
  เครื่องมือที่ใช้คือ <b>AI Coding Assistant แบบ agentic (ทำงานผ่าน CLI)</b> โดยให้ AI เข้ามาช่วยตั้งแต่
  วิเคราะห์ใบงาน → ออกแบบฐานข้อมูล → เขียน Source Code → สร้าง UI/UX → เขียน SQL → Debug/แก้ Error →
  สร้าง Test → ปรับปรุงและ Refactor → ตั้งค่า CI และ Deploy
  พัฒนาแบบ Incremental โดยแต่ละ commit แยกตามหน้าที่ เพื่อให้เห็นประวัติการพัฒนาชัดเจน
  ดูได้ที่ <code>git log --oneline</code>
</p>

<h3>3.1 AI ช่วยอะไรในแต่ละขั้นตอน</h3>
${aiTable}

<h3>3.2 การตรวจสอบงานของ AI (ไม่ได้เชื่อ AI 100%)</h3>
<p>ทุกครั้งที่ AI แก้โค้ด จะรันคำสั่งตรวจสอบจริงเสมอ ก่อนนำเสนอ:</p>
<div class="cmds">
  <div><span class="c">$</span> npm run lint &nbsp;&nbsp;&nbsp; <span class="ok">&#10003; ผ่าน (ESLint)</span></div>
  <div><span class="c">$</span> npm test &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="ok">&#10003; ผ่าน ${TEST_COUNT} เคส (Vitest)</span></div>
  <div><span class="c">$</span> npm run build &nbsp;&nbsp; <span class="ok">&#10003; ผ่าน (Next.js production build + TypeScript)</span></div>
</div>
<p style="margin-top:12px;">
  GitHub Actions บน GitHub รันชุดคำสั่งเดียวกันอัตโนมัติทุกครั้งที่ push (ตรวจสอบสถานะได้ที่แท็บ Actions ของ repository)
  และระบบถูก Deploy จริงบน Vercel แล้ว ทดสอบด้วยบัญชีจริงทุก Role และถ่ายภาพหน้าจอทั้ง 11 หน้าจอ
  ซึ่งเป็นภาพที่ 1–11 ท้ายรายงานนี้
</p>

<h3>3.3 ข้อจำกัดและบทบาทของมนุษย์</h3>
<ul>
  <li><b>ความถูกต้องของข้อมูล:</b> SQL และโค้ดที่ AI สร้างต้องรันบน Supabase จริงและตรวจสอบกับข้อมูลจริงก่อนเสนออาจารย์</li>
  <li><b>สิทธิ์ความปลอดภัย:</b> RLS และการตรวจสิทธิ์ซ้ำ ๆ สองชั้น (ฐานข้อมูล + UI) ต้องทดสอบด้วยบัญชีทดสอบจริงทุก Role</li>
  <li><b>UI/UX:</b> AI ช่วยสร้างได้ แต่ผู้ใช้ต้องลองใช้จริงแล้วปรับตามความต้องการ</li>
  <li><b>ข้อสรุป:</b> ใช้ AI เป็น “ผู้ช่วยพัฒนา” ไม่ใช่ตัวแทนการตรวจสอบ — ผลลัพธ์สุดท้ายคือโค้ดที่ผ่าน lint, test และ build พร้อมเอกสารและประวัติการพัฒนาครบถ้วน</li>
</ul>

<h2 style="break-before: page; page-break-before: always;"><span class="n">4</span><span class="t">รูปหน้าจอระบบ (Screenshot) — 11 ภาพ</span></h2>
${fig}

<div class="foot">Alarm &amp; Maintenance Management System — รายงานส่วนที่ 5 (สิ่งที่ต้องส่ง)<br/>สร้างอัตโนมัติ: {DATE}</div>

</body>
</html>`.replace("{DATE}", new Date().toLocaleDateString("en-GB"));

writeFileSync(HTML_PATH, html);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto("file:///" + HTML_PATH.replace(/\\/g, "/"), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: OUT_DIR + "/Report_Part5_Screenshots.pdf",
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;padding:0 14mm;font-family:Tahoma,sans-serif;
    display:flex;justify-content:space-between;border-bottom:0.4pt solid #e2e8f0;padding-bottom:3pt;">
    <span>Alarm &amp; Maintenance Management System</span>
    <span>รายงานส่วนที่ 5 — สิ่งที่ต้องส่ง</span></div>`,
  footerTemplate: `<div style="font-size:7.5pt;color:#94a3b8;width:100%;padding:0 14mm;font-family:Tahoma,sans-serif;
    display:flex;justify-content:space-between;border-top:0.4pt solid #e2e8f0;padding-top:3pt;">
    <span>Programming in Automation Systems</span>
    <span>หน้า <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  margin: { top: "20mm", bottom: "16mm", left: "14mm", right: "14mm" },
});
await browser.close();
console.log("PDF written");
