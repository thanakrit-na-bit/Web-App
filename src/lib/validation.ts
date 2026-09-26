import {
  ALARM_STATUSES,
  MACHINE_STATUSES,
  MAINTENANCE_STATUSES,
  type AlarmStatus,
  type MachineStatus,
  type MaintenanceStatus,
} from "@/lib/types";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const MAX_LENGTHS = {
  machineId: 32,
  shortText: 120,
  longText: 2000,
} as const;

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
      maintenance_date: maintenanceDate || new Date().toISOString().slice(0, 10),
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
