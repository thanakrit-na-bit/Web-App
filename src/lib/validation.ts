import {
  ALARM_STATUSES,
  MACHINE_STATUSES,
  MAINTENANCE_STATUSES,
  type AlarmStatus,
  type MachineStatus,
  type MaintenanceStatus,
} from "@/lib/types";
import { toDateInputValue } from "@/lib/time";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const MAX_LENGTHS = {
  machineId: 32,
  shortText: 120,
  longText: 2000,
} as const;

/** ความยาวโค้ดรีเซ็ตรหัสผ่าน (ตัวเลข 6 หลัก) */
export const RESET_CODE_LENGTH = 6;

/** อายุโค้ดรีเซ็ต (นาที) — ต้องตรงกับ expires_at ที่ออกโค้ดใน action */
export const RESET_CODE_TTL_MINUTES = 15;

/** จำนวนครั้งที่กรอกโค้ดผิดได้ก่อนโค้ดนั้นจะถูกเผา */
export const RESET_CODE_MAX_ATTEMPTS = 5;

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidDateTime(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

export type MachineInput = {
  machine_id: string;
  machine_name: string;
  machine_type: string;
  location: string;
  status: MachineStatus;
};

export function validateMachine(formData: FormData): ValidationResult<MachineInput> {
  const machine_id = field(formData, "machine_id");
  const machine_name = field(formData, "machine_name");
  const machine_type = field(formData, "machine_type");
  const location = field(formData, "location");
  const status = field(formData, "status") as MachineStatus;

  if (!machine_id || !machine_name || !machine_type || !location) {
    return { ok: false, error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }
  if (!MACHINE_STATUSES.includes(status)) {
    return { ok: false, error: "สถานะไม่ถูกต้อง" };
  }
  if (/\s/.test(machine_id)) {
    return { ok: false, error: "Machine ID ต้องไม่มีช่องว่าง" };
  }
  if (tooLong(machine_id, MAX_LENGTHS.machineId)) {
    return {
      ok: false,
      error: `Machine ID ต้องไม่ยาวเกิน ${MAX_LENGTHS.machineId} ตัวอักษร`,
    };
  }
  if (tooLong(machine_name, MAX_LENGTHS.shortText) || tooLong(machine_type, MAX_LENGTHS.shortText)) {
    return {
      ok: false,
      error: `ชื่อเครื่องจักรและประเภทต้องไม่ยาวเกิน ${MAX_LENGTHS.shortText} ตัวอักษร`,
    };
  }
  if (tooLong(location, MAX_LENGTHS.shortText)) {
    return { ok: false, error: `ตำแหน่งต้องไม่ยาวเกิน ${MAX_LENGTHS.shortText} ตัวอักษร` };
  }

  return { ok: true, data: { machine_id, machine_name, machine_type, location, status } };
}

export type AlarmInput = {
  machine_id: string;
  alarm_code: string;
  alarm_description: string;
  occurred_at: string;
  cause: string | null;
  status: AlarmStatus;
};

export function validateAlarm(formData: FormData): ValidationResult<AlarmInput> {
  const machine_id = field(formData, "machine_id");
  const alarm_code = field(formData, "alarm_code");
  const alarm_description = field(formData, "alarm_description");
  const occurredAt = field(formData, "occurred_at");
  const cause = field(formData, "cause");
  const status = field(formData, "status") as AlarmStatus;

  if (!machine_id || !alarm_code || !alarm_description) {
    return {
      ok: false,
      error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ (เครื่องจักร, Alarm Code, รายละเอียด)",
    };
  }
  if (!ALARM_STATUSES.includes(status)) {
    return { ok: false, error: "สถานะไม่ถูกต้อง" };
  }
  if (tooLong(alarm_code, MAX_LENGTHS.machineId)) {
    return { ok: false, error: `Alarm Code ต้องไม่ยาวเกิน ${MAX_LENGTHS.machineId} ตัวอักษร` };
  }
  if (tooLong(alarm_description, MAX_LENGTHS.longText)) {
    return { ok: false, error: `รายละเอียด Alarm ต้องไม่ยาวเกิน ${MAX_LENGTHS.longText} ตัวอักษร` };
  }
  if (tooLong(cause, MAX_LENGTHS.longText)) {
    return { ok: false, error: `สาเหตุต้องไม่ยาวเกิน ${MAX_LENGTHS.longText} ตัวอักษร` };
  }
  if (occurredAt && !isValidDateTime(occurredAt)) {
    return { ok: false, error: "รูปแบบวันที่/เวลาที่เกิด Alarm ไม่ถูกต้อง" };
  }

  return {
    ok: true,
    data: {
      machine_id,
      alarm_code,
      alarm_description,
      occurred_at: occurredAt || new Date().toISOString(),
      cause: cause || null,
      status,
    },
  };
}

export type MaintenanceInput = {
  machine_id: string;
  maintenance_type: string;
  problem: string;
  action_taken: string;
  technician: string | null;
  maintenance_date: string;
  status: MaintenanceStatus;
};

export function validateMaintenance(
  formData: FormData
): ValidationResult<MaintenanceInput> {
  const machine_id = field(formData, "machine_id");
  const maintenance_type = field(formData, "maintenance_type");
  const problem = field(formData, "problem");
  const action_taken = field(formData, "action_taken");
  const technician = field(formData, "technician");
  const maintenanceDate = field(formData, "maintenance_date");
  const status = field(formData, "status") as MaintenanceStatus;

  if (!machine_id || !maintenance_type || !problem || !action_taken) {
    return {
      ok: false,
      error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ (เครื่องจักร, ประเภทงานซ่อม, ปัญหา, การแก้ไข)",
    };
  }
  if (!MAINTENANCE_STATUSES.includes(status)) {
    return { ok: false, error: "สถานะไม่ถูกต้อง" };
  }
  if (tooLong(maintenance_type, MAX_LENGTHS.shortText)) {
    return {
      ok: false,
      error: `ประเภทงานซ่อมต้องไม่ยาวเกิน ${MAX_LENGTHS.shortText} ตัวอักษร`,
    };
  }
  if (tooLong(problem, MAX_LENGTHS.longText) || tooLong(action_taken, MAX_LENGTHS.longText)) {
    return { ok: false, error: `ปัญหาและการแก้ไขต้องไม่ยาวเกิน ${MAX_LENGTHS.longText} ตัวอักษร` };
  }
  if (tooLong(technician, MAX_LENGTHS.shortText)) {
    return { ok: false, error: `ชื่อช่างต้องไม่ยาวเกิน ${MAX_LENGTHS.shortText} ตัวอักษร` };
  }
  if (maintenanceDate && !isValidDateOnly(maintenanceDate)) {
    return { ok: false, error: "รูปแบบวันที่ทำบำรุงรักษาไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" };
  }

  return {
    ok: true,
    data: {
      machine_id,
      maintenance_type,
      problem,
      action_taken,
      technician: technician || null,
      maintenance_date: maintenanceDate || toDateInputValue(new Date()),
      status,
    },
  };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= 6;
}

/** โค้ดรีเซ็ตต้องเป็นตัวเลข 6 หลักเท่านั้น */
export function isValidResetCode(value: string): boolean {
  return new RegExp(`^\\d{${RESET_CODE_LENGTH}}$`).test(value.trim());
}

/**
 * เทียบสตริงแบบใช้เวลาคงที่ (constant-time) เพื่อไม่ให้เวลาตอบสนองบอกว่า
 * โค้ดถูกที่อักขระตำแหน่งใด แม้การเดาโค้ด 6 หลักจะช้าเกินจะใช้จริงก็ตาม
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();
  let diff = left.length ^ right.length;
  for (let i = 0; i < left.length; i++) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Escapes a user-supplied search term before it is interpolated into a
 * PostgREST `.or()` filter string. Without this, characters like `)` `,` `.`
 * can terminate the intended predicate and append new ones, and `%` `_` act
 * as SQL LIKE wildcards.
 */
export function sanitizeSearch(
  value: string | string[] | undefined | null
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, MAX_LENGTHS.shortText)
    .replace(/\\/g, "\\\\")
    .replace(/[%_,().*'"\t=]/g, (ch) => `\\${ch}`)
    .trim();
}
