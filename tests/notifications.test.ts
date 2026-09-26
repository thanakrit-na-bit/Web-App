import { describe, expect, it } from "vitest";
import {
  buildAlarmTrend,
  buildStatusSummary,
  daysBetween,
  maxOf,
  toDateKey,
} from "@/lib/analytics";
import {
  NOTIFICATION_RULES,
  buildNotifications,
  countBySeverity,
} from "@/lib/notifications";

const NOW = new Date(2026, 8, 26, 12, 0, 0);

describe("toDateKey / daysBetween", () => {
  it("แปลงวันที่เป็น YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("คืนค่าว่างเมื่อวันที่ไม่ถูกต้อง", () => {
    expect(toDateKey("not-a-date")).toBe("");
  });

  it("นับจำนวนวันแบบไม่รวมเวลา", () => {
    expect(daysBetween(new Date(2026, 8, 20), new Date(2026, 8, 26, 23, 59))).toBe(6);
  });
});

describe("buildAlarmTrend", () => {
  it("สร้างจำนวนวันเท่ากับที่กำหนด", () => {
    expect(buildAlarmTrend([], 14, NOW)).toHaveLength(14);
  });

  it("เรียงวันจากเก่าไปใหม่และวันสุดท้ายคือวันปัจจุบัน", () => {
    const points = buildAlarmTrend([], 3, NOW);
    expect(points.map((p) => p.date)).toEqual(["2026-09-24", "2026-09-25", "2026-09-26"]);
  });

  it("นับจำนวน Alarm แยกตามสถานะในแต่ละวัน", () => {
    const points = buildAlarmTrend(
      [
        { occurred_at: new Date(2026, 8, 26, 8, 0).toISOString(), status: "Open" },
        { occurred_at: new Date(2026, 8, 26, 9, 0).toISOString(), status: "Closed" },
        { occurred_at: new Date(2026, 8, 26, 10, 0).toISOString(), status: "In Progress" },
        { occurred_at: new Date(2026, 8, 25, 10, 0).toISOString(), status: "Open" },
      ],
      7,
      NOW
    );

    const today = points[points.length - 1];
    expect(today.total).toBe(3);
    expect(today.open).toBe(1);
    expect(today.closed).toBe(1);

    const yesterday = points[points.length - 2];
    expect(yesterday.total).toBe(1);
  });

  it("ไม่นับ Alarm ที่เกิดนอกช่วงเวลาที่แสดง", () => {
    const points = buildAlarmTrend(
      [{ occurred_at: new Date(2026, 0, 1).toISOString(), status: "Open" }],
      7,
      NOW
    );
    expect(points.every((point) => point.total === 0)).toBe(true);
  });
});

describe("buildStatusSummary", () => {
  it("คำนวณเปอร์เซ็นต์จากยอดรวม", () => {
    expect(buildStatusSummary([{ label: "A", value: 1 }, { label: "B", value: 3 }])).toEqual([
      { label: "A", value: 1, percent: 25 },
      { label: "B", value: 3, percent: 75 },
    ]);
  });

  it("ไม่หารด้วยศูนย์เมื่อไม่มีข้อมูล", () => {
    expect(buildStatusSummary([{ label: "A", value: 0 }])).toEqual([
      { label: "A", value: 0, percent: 0 },
    ]);
  });
});

describe("maxOf", () => {
  it("คืนค่าสูงสุด และไม่ติดลบ", () => {
    expect(maxOf([1, 9, 4])).toBe(9);
    expect(maxOf([])).toBe(0);
  });
});

describe("buildNotifications", () => {
  it("แจ้งเตือน Alarm ที่ยัง Open เป็นระดับ warning เมื่อเพิ่งเกิด", () => {
    const items = buildNotifications({
      alarms: [
        {
          id: "a1",
          alarm_code: "AL-101",
          status: "Open",
          occurred_at: new Date(2026, 8, 26, 11, 0).toISOString(),
          machineLabel: "M-001",
        },
      ],
      maintenance: [],
      now: NOW,
    });

    expect(items).toHaveLength(1);
    expect(items[0].severity).toBe("warning");
    expect(items[0].detail).toContain("M-001");
    expect(items[0].href).toBe("/alarms");
  });

  it("ยกระดับเป็น critical เมื่อ Alarm ค้างเกินเวลาที่กำหนด", () => {
    const staleHours = NOTIFICATION_RULES.staleAlarmHours + 5;
    const items = buildNotifications({
      alarms: [
        {
          id: "a1",
          alarm_code: "AL-102",
          status: "Open",
          occurred_at: new Date(NOW.getTime() - staleHours * 3_600_000).toISOString(),
        },
      ],
      maintenance: [],
      now: NOW,
    });

    expect(items[0].severity).toBe("critical");
    expect(items[0].detail).toContain("ค้างมา");
  });

  it("ไม่แจ้งเตือน Alarm ที่ปิดแล้ว", () => {
    const items = buildNotifications({
      alarms: [
        {
          id: "a1",
          alarm_code: "AL-103",
          status: "Closed",
          occurred_at: new Date(2026, 8, 20).toISOString(),
        },
      ],
      maintenance: [],
      now: NOW,
    });

    expect(items).toHaveLength(0);
  });

  it("แจ้งเตือน Alarm ที่กำลังแก้ไขเป็นระดับ info", () => {
    const items = buildNotifications({
      alarms: [
        {
          id: "a1",
          alarm_code: "AL-104",
          status: "In Progress",
          occurred_at: new Date(2026, 8, 26, 8, 0).toISOString(),
        },
      ],
      maintenance: [],
      now: NOW,
    });

    expect(items[0].severity).toBe("info");
  });

  it("แจ้งเตือนงานซ่อมที่เลยกำหนด", () => {
    const items = buildNotifications({
      alarms: [],
      maintenance: [
        {
          id: "m1",
          status: "Scheduled",
          maintenance_date: "2026-09-24",
          machineLabel: "M-002",
        },
      ],
      now: NOW,
    });

    expect(items[0].severity).toBe("warning");
    expect(items[0].detail).toContain("เลยกำหนดมา 2 วัน");
  });

  it("ยกระดับงานซ่อมที่เลยกำหนดนานเป็น critical", () => {
    const items = buildNotifications({
      alarms: [],
      maintenance: [
        { id: "m1", status: "Scheduled", maintenance_date: "2026-09-10" },
      ],
      now: NOW,
    });

    expect(items[0].severity).toBe("critical");
  });

  it("ไม่แจ้งเตือนงานซ่อมที่ยังไม่ถึงกำหนดหรือปิดงานแล้ว", () => {
    const items = buildNotifications({
      alarms: [],
      maintenance: [
        { id: "m1", status: "Scheduled", maintenance_date: "2026-09-30" },
        { id: "m2", status: "Completed", maintenance_date: "2026-09-01" },
      ],
      now: NOW,
    });

    expect(items).toHaveLength(0);
  });

  it("เรียงลำดับตามความรุนแรงก่อน แล้วจึงตามเวลา", () => {
    const items = buildNotifications({
      alarms: [
        {
          id: "a1",
          alarm_code: "AL-105",
          status: "In Progress",
          occurred_at: new Date(2026, 8, 26, 11, 0).toISOString(),
        },
        {
          id: "a2",
          alarm_code: "AL-106",
          status: "Open",
          occurred_at: new Date(2026, 8, 26, 10, 0).toISOString(),
        },
      ],
      maintenance: [
        { id: "m1", status: "Scheduled", maintenance_date: "2026-09-01" },
      ],
      now: NOW,
    });

    expect(items.map((item) => item.severity)).toEqual(["critical", "warning", "info"]);
  });
});

describe("countBySeverity", () => {
  it("นับจำนวนรายการแยกตามระดับ", () => {
    const items = buildNotifications({
      alarms: [
        { id: "a1", alarm_code: "A", status: "Open", occurred_at: new Date(2026, 8, 26, 11).toISOString() },
        { id: "a2", alarm_code: "B", status: "In Progress", occurred_at: new Date(2026, 8, 26, 11).toISOString() },
      ],
      maintenance: [],
      now: NOW,
    });

    expect(countBySeverity(items)).toEqual({ critical: 0, warning: 1, info: 1 });
  });
});
