// Employee types for POS system

export type EmployeeRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "STAFF"
  | "KITCHEN";

export type TimeClockStatus =
  | "CLOCKED_IN"
  | "ON_BREAK"
  | "CLOCKED_OUT";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: EmployeeRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
}

export interface TimeClockEntry {
  id: string;
  employeeId: string;
  employee: EmployeeSummary;
  clockInAt: string;
  clockOutAt: string | null;
  breakMinutes: number;
  notes: string | null;
  status: TimeClockStatus;
  hoursWorked: number;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Exclude<EmployeeRole, "OWNER">;
  password: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: Exclude<EmployeeRole, "OWNER">;
  isActive?: boolean;
}
