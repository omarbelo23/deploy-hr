export type ClaimRecord = {
  id: string;
  claimId: string;
  claimType: string;
  description: string;
  employee: string;
  amount: number;
  approvedAmount?: number;
  status: string;
  financeOwner?: string;
  updatedOn: string;
  statusHistory?: { status: string; at: string; note?: string }[];
  expenseDetails?: {
    category?: string;
    merchant?: string;
    incurredAt?: string;
    receipts?: string[];
  };
};

export type DisputeRecord = {
  id: string;
  disputeId: string;
  description: string;
  employee: string;
  payslipId: string;
  status: string;
  payrollOwner?: string;
  updatedOn: string;
  statusHistory?: { status: string; at: string; note?: string }[];
};

export type RefundRecord = {
  refundId: string;
  reference: string;
  referenceType: "Claim" | "Dispute";
  reason: string;
  amount: number;
  status: string;
  payrollRun?: string;
  updatedOn: string;
};

export type PayslipRecord = {
  id: string;
  payrollRun?: string;
  employee?: string;
  department?: string;
  contractType?: string;
  workType?: string;
  baseSalary: number;
  allowances: { name?: string; amount?: number }[];
  transportAllowances: { name?: string; amount?: number }[];
  bonuses: { name?: string; amount?: number }[];
  benefits: { name?: string; amount?: number }[];
  leaveEncashment: { name?: string; amount?: number }[];
  refunds: { description?: string; amount?: number }[];
  taxes: { name?: string; rate?: number }[];
  insurances: { name?: string; employeeRate?: number; employerRate?: number }[];
  employerInsuranceContributions: { name?: string; employerRate?: number; amount?: number }[];
  penalties?: { reason?: string; amount?: number }[] | null;
  unpaidLeave: { reason?: string; amount?: number }[];
  netPay: number;
  totalGrossSalary: number;
  totalDeductions: number;
  status: string;
  dispute?: { disputeId?: string; status?: string };
  createdAt?: string;
  updatedAt?: string;
};
