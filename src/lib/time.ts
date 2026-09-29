export const DEFAULT_TIMEZONE = "Asia/Bangkok";

/** ตั้งเวลาได้ผ่าน NEXT_PUBLIC_APP_TIMEZONE (ต้อง rebuild เมื่อเปลี่ยน) */
export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim() || DEFAULT_TIMEZONE;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsIn(value: string | Date, timeZone: string): ZonedParts | null {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = part.value;
  }

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour) % 24,
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

/** จำนวนมิลลิวินาทีที่เขตเวลานั้นเร็วกว่า/ช้ากว่า UTC ณ เวลานั้น */
function offsetMs(date: Date, timeZone: string): number {
  const parts = partsIn(date, timeZone);
  if (!parts) return 0;
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

/** แปลง "เวลาในเขตเวลา" ให้เป็น Date (UTC instant) */
export function zonedToDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  timeZone: string = APP_TIMEZONE
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  let result = guess - offsetMs(new Date(guess), timeZone);
  result = guess - offsetMs(new Date(result), timeZone);
  return new Date(result);
}

/** 00:00 ของวันนั้นตามเขตเวลาแอป คืนเป็น Date (UTC instant) */
export function startOfDay(
  value: string | Date = new Date(),
  timeZone: string = APP_TIMEZONE
): Date {
  const parts = partsIn(value, timeZone);
  if (!parts) return new Date(NaN);
  return zonedToDate(parts.year, parts.month, parts.day, 0, 0, 0, timeZone);
}

function pad(value: number): string {
  return `${value}`.padStart(2, "0");
}

function keyFrom(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** แยกคีย์วันที่ คืน null เมื่อรูปแบบผิดหรือเป็นวันที่ที่ไม่มีจริง (เช่น 2026-02-31) */
function parseKey(key: string): { year: number; month: number; day: number } | null {
  if (!DATE_KEY.test(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() + 1 === month &&
    probe.getUTCDate() === day;
  return isRealDate ? { year, month, day } : null;
}

/** คีย์วันตามเขตเวลาแอป เช่น "2026-09-28" (รับคีย์วันที่มีอยู่แล้วได้โดยไม่แปลง) */
export function toDateKey(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  if (typeof value === "string") {
    if (DATE_KEY.test(value)) return parseKey(value) ? value : "";
    if (!value.trim()) return "";
  }
  const parts = partsIn(value, timeZone);
  if (!parts) return "";
  return keyFrom(parts.year, parts.month, parts.day);
}

/** เลื่อนคีย์วันไปข้างหน้า/หลัง n วัน (คณิตบนปฏิทินล้วน ไม่กระทบ DST) */
export function addDaysToKey(key: string, days: number): string {
  const parsed = parseKey(key);
  if (!parsed) return "";
  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return keyFrom(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate()
  );
}

/** ป้ายวันที่สั้น ๆ จากคีย์วัน เช่น "28/9" (ไม่ผ่าน Date จึงไม่มีปัญหาเขตเวลา) */
export function labelFromKey(key: string): string {
  const parsed = parseKey(key);
  if (!parsed) return "";
  return `${parsed.day}/${parsed.month}`;
}

/** รูปแบบสำหรับ <input type="datetime-local"> ซึ่งตีความค่าเป็นเวลาท้องถิ่น */
export function toDateTimeLocalValue(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  const parts = partsIn(value, timeZone);
  if (!parts) return "";
  return `${keyFrom(parts.year, parts.month, parts.day)}T${pad(
    parts.hour
  )}:${pad(parts.minute)}`;
}

/** รูปแบบสำหรับ <input type="date"> */
export function toDateInputValue(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  return toDateKey(value, timeZone);
}

/** 00:00 ของวันที่ระบุด้วยคีย์ "YYYY-MM-DD" ตามเขตเวลาแอป */
export function startOfDayFromKey(
  key: string,
  timeZone: string = APP_TIMEZONE
): Date {
  const parsed = parseKey(key);
  if (!parsed) return new Date(NaN);
  return zonedToDate(parsed.year, parsed.month, parsed.day, 0, 0, 0, timeZone);
}

export function formatDateTime(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateOnly(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTime(
  value: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
