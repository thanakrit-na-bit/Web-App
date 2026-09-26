import { describe, expect, it } from "vitest";
import { buildCsv } from "@/lib/csv";
import { pick } from "@/lib/pick";
import { can, PERMISSIONS } from "@/lib/permissions";
import {
  ALARM_STATUSES,
  MACHINE_STATUSES,
  MAINTENANCE_STATUSES,
  ROLES,
} from "@/lib/types";

describe("buildCsv", () => {
  it("ขึ้นต้นด้วย BOM เพื่อให้ Excel เปิดภาษาไทยได้", () => {
    expect(buildCsv(["a"], [["1"]]).charCodeAt(0)).toBe(0xfeff);
  });

  it("ใช้ CRLF แยกแต่ละแถว", () => {
    const csv = buildCsv(["id", "name"], [["1", "A"], ["2", "B"]]);
    expect(csv).toBe("\uFEFFid,name\r\n1,A\r\n2,B");
  });

  it("ครอบค่าที่มี comma ด้วยเครื่องหมายคำพูด", () => {
    expect(buildCsv(["a"], [["x,y"]])).toBe('\uFEFFa\r\n"x,y"');
  });

  it("escape เครื่องหมายคำพูดด้วยการเพิ่มอีกเครื่องหมาย", () => {
    expect(buildCsv(["a"], [['he said "hi"']])).toBe('\uFEFFa\r\n"he said ""hi"""');
  });

  it("แปลง null และ undefined เป็นช่องว่าง", () => {
    expect(buildCsv(["a", "b"], [[null, undefined]])).toBe("\uFEFFa,b\r\n,");
  });

  it("รองรับค่าที่มี newline", () => {
    expect(buildCsv(["a"], [["line1\nline2"]])).toBe('\uFEFFa\r\n"line1\nline2"');
  });
});

describe("pick", () => {
  it("คืนค่าจาก key ที่มีอยู่", () => {
    expect(pick({ a: "x" }, "a", "fallback")).toBe("x");
  });

  it("คืนค่า fallback เมื่อไม่มี key", () => {
    expect(pick({ a: "x" }, "b", "fallback")).toBe("fallback");
  });

  it("คืนค่า fallback เมื่อค่าเป็น null หรือ undefined", () => {
    expect(pick({ a: null } as Record<string, string | null>, "a", "fallback")).toBe(
      "fallback"
    );
  });
});

describe("can (สิทธิ์ตาม Role)", () => {
  it("Admin ทำได้ทุกอย่าง", () => {
    for (const permission of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(can("admin", permission)).toBe(true);
    }
  });

  it("Technician แก้ไข Alarm/Maintenance ได้ แต่จัดการเครื่องจักรและผู้ใช้ไม่ได้", () => {
    expect(can("technician", "editAlarms")).toBe(true);
    expect(can("technician", "editMaintenance")).toBe(true);
    expect(can("technician", "manageMachines")).toBe(false);
    expect(can("technician", "manageUsers")).toBe(false);
    expect(can("technician", "viewAuditLog")).toBe(false);
  });

  it("Viewer ดูได้อย่างเดียว", () => {
    expect(can("viewer", "viewDashboard")).toBe(true);
    expect(can("viewer", "viewRecords")).toBe(true);
    expect(can("viewer", "editAlarms")).toBe(false);
    expect(can("viewer", "editMaintenance")).toBe(false);
    expect(can("viewer", "manageMachines")).toBe(false);
  });

  it("ไม่มี role ให้สิทธิ์ใด ๆ", () => {
    expect(can(null, "viewDashboard")).toBe(false);
    expect(can(undefined, "editAlarms")).toBe(false);
  });
});

describe("ค่าคงที่สถานะตรงกับฐานข้อมูล", () => {
  it("สถานะเครื่องจักรมี 4 ค่า", () => {
    expect(MACHINE_STATUSES).toEqual(["Running", "Stop", "Alarm", "Maintenance"]);
  });

  it("สถานะ Alarm มี 3 ค่า", () => {
    expect(ALARM_STATUSES).toEqual(["Open", "In Progress", "Closed"]);
  });

  it("สถานะงานซ่อมมี 4 ค่า รวม Waiting Part", () => {
    expect(MAINTENANCE_STATUSES).toEqual([
      "Scheduled",
      "In Progress",
      "Completed",
      "Waiting Part",
    ]);
  });

  it("มี 3 role ตามที่กำหนด", () => {
    expect(ROLES).toEqual(["admin", "technician", "viewer"]);
  });
});
