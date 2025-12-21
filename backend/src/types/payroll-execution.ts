
export enum PayrollCycleStatus {

  UNDER_REVIEW = "UNDER_REVIEW",

  REVIEWING_BY_MANAGER = "REVIEWING_BY_MANAGER",

  WAITING_FINANCE_APPROVAL = "WAITING_FINANCE_APPROVAL",

  APPROVED = "APPROVED",

  REJECTED = "REJECTED",

  EXECUTED = "EXECUTED"

}



export interface PayrollCycle {

  _id: string;

  period: string;

  status: PayrollCycleStatus;

  summary: {

    totalEmployees: number;

    totalGrossPay: number;

    totalDeductions: number;

    totalNetPay: number;

  };

  anomalies: Array<{

    employeeId: string;

    employeeName: string;

    issue: string;

    severity: string;

  }>;

  auditLog: Array<{

    timestamp: string;

    user: string;

    action: string;

    details?: string;

  }>;

}

