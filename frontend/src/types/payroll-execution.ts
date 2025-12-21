// Type definitions for payroll execution

export enum PayrollCycleStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVIEWING_BY_MANAGER = 'REVIEWING_BY_MANAGER',
  WAITING_FINANCE_APPROVAL = 'WAITING_FINANCE_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
}

export interface PayrollAnomaly {
  employeeId: string;
  name: string;
  issue: string;
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  reason?: string;
}

export interface PayrollSummary {
  totalGross: number;
  totalTaxes: number;
  totalNetPayable: number;
  employeeCount: number;
}

export interface PayrollCycle {
  id: string;
  period: string;
  status: PayrollCycleStatus;
  summary: PayrollSummary;
  anomalies: PayrollAnomaly[];
  auditLog: AuditLogEntry[];
}

export interface PayrollEmployee {
  id: string;
  name: string;
  department: string;
  grossPay: number;
  taxes: number;
  netPay: number;
  status: string;
}

export interface PayrollExecutionStatus {
  status: PayrollCycleStatus | string;
  cyclePeriod: string;
  employeeCount: number;
  totalAmount?: number;
}
