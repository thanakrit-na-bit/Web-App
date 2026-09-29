import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  formatDateOnly,
  formatDateTime,
  formatTime,
  labelFromKey,
  startOfDay,
  startOfDayFromKey,
  toDateInputValue,
  toDateKey,
  toDateTimeLocalValue,
  zonedToDate,
} from "@/lib/time";
import { buildAlarmTrend, daysBetween } from "@/lib/analytics";

const TZ = "Asia/Bangkok";

describe("toDateKey", () => {
  it("นับเป็นวันตามเขตเวลาแอป ไม่ใช่วัน UTC", () => {
    // 2026-09-26 17:30 UTC = 2026-09-27 00:30 น. เวลาไทย
    expect(toDateKey("2026-09-26T17:30:00Z", TZ)).toBe("2026-09-27");
  });

  it("ยังนับเป็นวันเดิมเมื่อเวลาไทยยังไม่ข้ามวัน", () => {
    expect(toDateKey("2026-09-26T10:00:00Z", TZ)).toBe("2026-09-26");
  });

  it("รับคีย์วันที่ YYYY-MM-DD ที่มีอยู่แล้วโดยไม่แปลง", () => {
    expect(toDateKey("2026-01-01", TZ)).toBe("2026-01-01");
    expect(toDateKey("2026-01-01", "America/New_York")).toBe("2026-01-01");
  });

  it("คืนค่าว่างเมื่อวันที่ไม่ถูกต้อง", () => {
    expect(toDateKey("not-a-date", TZ)).toBe("");
  });

  it("ใช้เขตเวลาไทยเป็นค่าเริ่มต้นของแอป", () => {
    expect(toDateKey("2026-09-26T17:30:00Z")).toBe("2026-09-27");
  });
});

describe("addDaysToKey", () => {
  it("ถอยหลังได้ข้ามเดือน", () => {
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("ถอยหลังได้ข้ามปี", () => {
    expect(addDaysToKey("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("เดินหน้าได้ข้ามเดือน", () => {
    expect(addDaysToKey("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("คืนค่าว่างเมื่อคีย์ไม่ถูกต้อง", () => {
    expect(addDaysToKey("2026-1", 1)).toBe("");
    expect(addDaysToKey("2026-02-31", 1)).toBe("");
  });
});

describe("labelFromKey", () => {
  it("ตัดปีทิ้งและไม่เติมศูนย์ข้างหน้า", () => {
    expect(labelFromKey("2026-09-05")).toBe("5/9");
  });
});

describe("zonedToDate / startOfDay", () => {
  it("แปลงเวลาไทยเป็น UTC instant ได้ถูกต้อง", () => {
    expect(zonedToDate(2026, 9, 27, 0, 0, 0, TZ).toISOString()).toBe(
      "2026-09-26T17:00:00.000Z"
    );
  });

  it("00:00 ตามเวลาไทยคือ 17:00 UTC ของวันก่อนหน้า", () => {
    expect(startOfDayFromKey("2026-09-27", TZ).toISOString()).toBe(
      "2026-09-26T17:00:00.000Z"
    );
  });

  it("startOfDay คืน 00:00 ของวันนั้นตามเวลาไทย", () => {
    const at = "2026-09-26T17:30:00Z"; // 27 ก.ย. 00:30 น. เวลาไทย
    expect(startOfDay(at, TZ).toISOString()).toBe("2026-09-26T17:00:00.000Z");
  });

  it("คืนค่า Invalid Date เมื่อคีย์ไม่ถูกต้อง", () => {
    expect(Number.isNaN(startOfDayFromKey("2026-13-40", TZ).getTime())).toBe(true);
  });
});

describe("ค่าสำหรับ input", () => {
  it("datetime-local ได้ค่าตามเวลาไทย", () => {
    expect(toDateTimeLocalValue("2026-09-26T17:30:00Z", TZ)).toBe("2026-09-27T00:30");
  });

  it("date input ได้ค่าตามเวลาไทย", () => {
    expect(toDateInputValue("2026-09-26T17:30:00Z", TZ)).toBe("2026-09-27");
  });

  it("คืนค่าว่างเมื่อวันที่ไม่ถูกต้อง", () => {
    expect(toDateTimeLocalValue("not-a-date", TZ)).toBe("");
  });
});

describe("การแสดงผลเวลา", () => {
  it("formatDateTime แสดงตามเวลาไทย", () => {
    expect(formatDateTime("2026-09-26T17:30:00Z", TZ)).toBe("27/09/2026, 00:30");
  });

  it("formatDateOnly แสดงตามเวลาไทย", () => {
    expect(formatDateOnly("2026-09-26T17:30:00Z", TZ)).toBe("27/09/2026");
  });

  it("formatTime แสดงตามเวลาไทย", () => {
    expect(formatTime("2026-09-26T17:30:05Z", TZ)).toBe("00:30:05");
  });

  it("คืนค่ายัตึกถอนสำหรับวันที่ไม่ถูกต้อง", () => {
    expect(formatDateTime("not-a-date", TZ)).toBe("-");
    expect(formatDateOnly("not-a-date", TZ)).toBe("-");
    expect(formatTime("not-a-date", TZ)).toBe("-");
  });
});

describe("daysBetween บนเขตเวลาแอป", () => {
  it("นับจากคีย์วันได้โดยไม่เลื่อนวัน", () => {
    expect(daysBetween("2026-09-20", "2026-09-26T06:00:00Z", TZ)).toBe(6);
  });

  it("เวลาไทยที่ข้ามคืนแล้วนับเป็นวันถัดไป", () => {
    // 00:30 น. เวลาไทยของ 27 ก.ย. คือ 26 ก.ย. 17:30 UTC จึงนับถึง 27 ก.ย.
    expect(daysBetween("2026-09-20", "2026-09-26T17:30:00Z", TZ)).toBe(7);
    expect(daysBetween("2026-09-27T00:30:00+07:00", "2026-09-26T17:30:00Z", TZ)).toBe(0);
  });

  it("ข้ามเดือนแล้วยังนับถูก", () => {
    expect(daysBetween("2026-08-28", "2026-09-02", TZ)).toBe(5);
  });

  it("คืนค่า 0 เมื่อคีย์ไม่ถูกต้อง", () => {
    expect(daysBetween("nope", "2026-09-26", TZ)).toBe(0);
  });
});

describe("buildAlarmTrend นับวันตามเวลาไทย", () => {
  it("Alarm 00:30 น. เวลาไทยต้องอยู่ในวันถัดไป ไม่ใช่วันก่อนหน้า", () => {
    const points = buildAlarmTrend(
      [{ occurred_at: "2026-09-26T17:30:00Z", status: "Open" }],
      3,
      new Date("2026-09-26T17:45:00Z"), // 27 ก.ย. 00:45 น. เวลาไทย
      TZ
    );

    expect(points.map((point) => point.date)).toEqual([
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
    ]);
    expect(points[0].total).toBe(0);
    expect(points[1].total).toBe(0);
    expect(points[2].total).toBe(1);
  });

  it("แยกจำนวนตามสถานะครบทั้ง 3 สถานะ", () => {
    const points = buildAlarmTrend(
      [
        { occurred_at: "2026-09-27T02:00:00Z", status: "Open" },
        { occurred_at: "2026-09-27T03:00:00Z", status: "In Progress" },
        { occurred_at: "2026-09-27T04:00:00Z", status: "Closed" },
      ],
      1,
      new Date("2026-09-26T20:00:00Z"),
      TZ
    );

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      date: "2026-09-27",
      label: "27/9",
      total: 3,
      open: 1,
      inProgress: 1,
      closed: 1,
    });
  });
});
