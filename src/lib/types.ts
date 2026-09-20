export type Role = "admin" | "technician" | "viewer";

export const ROLES: Role[] = ["admin", "technician", "viewer"];

export type MachineStatus = "Running" | "Stop" | "Alarm" | "Maintenance";
export type AlarmStatus = "Open" | "In Progress" | "Closed";
export type MaintenanceStatus =
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Waiting Part";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
  location: string;
  status: MachineStatus;
  created_at: string;
  updated_at: string;
};

export type Alarm = {
  id: string;
  machine_id: string;
  alarm_code: string;
  alarm_description: string;
  occurred_at: string;
  cause: string | null;
  status: AlarmStatus;
  created_at: string;
  machines?: Pick<Machine, "machine_id" | "machine_name">;
};

export type Maintenance = {
  id: string;
  machine_id: string;
  maintenance_type: string;
  problem: string;
  action_taken: string;
  technician: string | null;
  maintenance_date: string;
  status: MaintenanceStatus;
  created_at: string;
  machines?: Pick<Machine, "machine_id" | "machine_name">;
};

export const MACHINE_STATUSES: MachineStatus[] = [
  "Running",
  "Stop",
  "Alarm",
  "Maintenance",
];

export const ALARM_STATUSES: AlarmStatus[] = [
  "Open",
  "In Progress",
  "Closed",
];

export const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Waiting Part",
];

export type AuditLog = {
  id: string;
  user_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
};