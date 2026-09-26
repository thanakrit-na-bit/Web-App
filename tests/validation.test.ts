import { describe, expect, it } from "vitest";
import {
  MAX_LENGTHS,
  isValidEmail,
  isValidPassword,
  validateAlarm,
  validateMachine,
  validateMaintenance,
} from "@/lib/validation";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.append(key, value);
  }
  return data;
}

const validMachine = {
  machine_id: "M-001",
  machine_name: "CNC Lathe 1",
  machine_type: "CNC Lathe",
  location: "Factory A - Zone 1",
  status: "Running",
};

const validAlarm = {
  machine_id: "3f1b0a2c-0000-4000-8000-000000000001",
  alarm_code: "AL-101",
  alarm_description: "Over temperature",
  occurred_at: "2026-09-20T08:30",
  cause: "พัดลมหยุดทำงาน",
  status: "Open",
};

const validMaintenance = {
  machine_id: "3f1b0a2c-0000-4000-8000-000000000001",
  maintenance_type: "งานซ่อมเชิงป้องกัน",
  problem: "น้ำมันเครื่องมัก",
  action_taken: "เปลี่ยนน้ำมันและกรองใหม่",
  technician: "สมชาย",
  maintenance_date: "2026-09-21",
  status: "Completed",
};

describe("validateMachine", () => {
  it("ยอมรับข้อมูลที่ถูกต้อง", () => {
    const result = validateMachine(form(validMachine));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(validMachine);
    }
  });

  it("ตัดช่องว่างหัวท้ายออกจากทุกช่อง", () => {
    const result = validateMachine(
      form({ ...validMachine, machine_name: "  CNC Lathe 1  " })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.machine_name).toBe("CNC Lathe 1");
  });

  it("ตรวจจับช่องว่างที่ว่างเปล่า", () => {
    const result = validateMachine(form({ ...validMachine, location: "   " }));
    expect(result).toEqual({ ok: false, error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
  });

  it("ปฏิเสธสถานะที่ไม่อยู่ในรายการที่กำหนด", () => {
    const result = validateMachine(form({ ...validMachine, status: "Broken" }));
    expect(result).toEqual({ ok: false, error: "สถานะไม่ถูกต้อง" });
  });

  it("ปฏิเสธ Machine ID ที่มีช่องว่างข้างใน", () => {
    const result = validateMachine(form({ ...validMachine, machine_id: "M 001" }));
    expect(result.ok).toBe(false);
  });

  it("ปฏิเสธ Machine ID ที่ยาวเกินกำหนด", () => {
    const result = validateMachine(
      form({ ...validMachine, machine_id: "M".repeat(MAX_LENGTHS.machineId + 1) })
    );
    expect(result.ok).toBe(false);
  });

  it("ปฏิเสธชื่อเครื่องจักรที่ยาวเกินกำหนด", () => {
    const result = validateMachine(
      form({ ...validMachine, machine_name: "ก".repeat(MAX_LENGTHS.shortText + 1) })
    );
    expect(result.ok).toBe(false);
  });
});

describe("validateAlarm", () => {
  it("ยอมรับข้อมูลที่ถูกต้อง", () => {
    const result = validateAlarm(form(validAlarm));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.alarm_code).toBe("AL-101");
      expect(result.data.cause).toBe("พัดลมหยุดทำงาน");
    }
  });

  it("ตรวจจับช่องที่จำเป็นขาด", () => {
    const result = validateAlarm(form({ ...validAlarm, alarm_code: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
  });

  it("ปฏิเสธสถานะ Alarm ที่ไม่ถูกต้อง", () => {
    const result = validateAlarm(form({ ...validAlarm, status: "Pending" }));
    expect(result).toEqual({ ok: false, error: "สถานะไม่ถูกต้อง" });
  });

  it("เติมเวลาเกิดเป็นเวลาปัจจุบันเมื่อไม่ได้กรอก", () => {
    const result = validateAlarm(
      form({
        machine_id: validAlarm.machine_id,
        alarm_code: validAlarm.alarm_code,
        alarm_description: validAlarm.alarm_description,
        cause: validAlarm.cause,
        status: validAlarm.status,
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(Number.isNaN(Date.parse(result.data.occurred_at))).toBe(false);
  });

  it("แปลง cause ว่างเป็น null", () => {
    const result = validateAlarm(form({ ...validAlarm, cause: "  " }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.cause).toBeNull();
  });

  it("ปฏิเสธวันที่/เวลาที่ผิดรูปแบบ", () => {
    const result = validateAlarm(form({ ...validAlarm, occurred_at: "not-a-date" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("วันที่/เวลา");
  });

  it("ปฏิเสธรายละเอียดที่ยาวเกินกำหนด", () => {
    const result = validateAlarm(
      form({ ...validAlarm, alarm_description: "x".repeat(MAX_LENGTHS.longText + 1) })
    );
    expect(result.ok).toBe(false);
  });
});

describe("validateMaintenance", () => {
  it("ยอมรับข้อมูลที่ถูกต้อง", () => {
    const result = validateMaintenance(form(validMaintenance));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("Completed");
  });

  it("ตรวจจับ action_taken ที่ว่าง", () => {
    const result = validateMaintenance(form({ ...validMaintenance, action_taken: "" }));
    expect(result.ok).toBe(false);
  });

  it("ปฏิเสธสถานะที่ไม่ถูกต้อง", () => {
    const result = validateMaintenance(form({ ...validMaintenance, status: "Done" }));
    expect(result).toEqual({ ok: false, error: "สถานะไม่ถูกต้อง" });
  });

  it("รองรับสถานะ Waiting Part (บอนัส)", () => {
    const result = validateMaintenance(form({ ...validMaintenance, status: "Waiting Part" }));
    expect(result.ok).toBe(true);
  });

  it("ปฏิเสธวันที่ที่ไม่ใช่ YYYY-MM-DD", () => {
    const result = validateMaintenance(
      form({ ...validMaintenance, maintenance_date: "21/09/2026" })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("YYYY-MM-DD");
  });

  it("ปฏิเสธวันที่ที่ไม่มีอยู่จริง", () => {
    const result = validateMaintenance(
      form({ ...validMaintenance, maintenance_date: "2026-02-31" })
    );
    expect(result.ok).toBe(false);
  });

  it("เติมวันที่ปัจจุบันเมื่อไม่ได้กรอก", () => {
    const result = validateMaintenance(
      form({
        machine_id: validMaintenance.machine_id,
        maintenance_type: validMaintenance.maintenance_type,
        problem: validMaintenance.problem,
        action_taken: validMaintenance.action_taken,
        technician: validMaintenance.technician,
        status: validMaintenance.status,
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.maintenance_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("แปลงช่างที่ว่างเป็น null", () => {
    const result = validateMaintenance(form({ ...validMaintenance, technician: "" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.technician).toBeNull();
  });
});

describe("isValidEmail / isValidPassword", () => {
  it("ตรวจรูปแบบอีเมล", () => {
    expect(isValidEmail("tech@factory.com")).toBe(true);
    expect(isValidEmail("tech@factory.co.th")).toBe(true);
    expect(isValidEmail("tech.factory.com")).toBe(false);
    expect(isValidEmail("tech@factory")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("ตรวจความยาวรหัสผ่านอย่างน้อย 6 ตัวอักษร", () => {
    expect(isValidPassword("12345")).toBe(false);
    expect(isValidPassword("123456")).toBe(true);
  });
});
