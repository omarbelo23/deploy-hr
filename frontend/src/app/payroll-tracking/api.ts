import type {
  ClaimRecord,
  DisputeRecord,
  RefundRecord,
  PayslipRecord,
} from "./data";
import { api as sharedApi } from "@/lib/api";

type RefShape = {
  _id?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  claimId?: string;
  disputeId?: string;
  runId?: string;
};

type Ref = string | RefShape | undefined;

type ClaimApi = {
  _id?: string;
  claimId?: string;
  claimType?: string;
  description?: string;
  employeeId?: Ref;
  financeStaffId?: Ref;
  amount?: number;
  approvedAmount?: number;
  status?: string;
  updatedAt?: string;
  statusHistory?: { status?: string; at?: string; note?: string }[];
};

type DisputeApi = {
  _id?: string;
  disputeId?: string;
  description?: string;
  employeeId?: Ref;
  payrollSpecialistId?: Ref;
  payslipId?: string;
  status?: string;
  updatedAt?: string;
  statusHistory?: { status?: string; at?: string; note?: string }[];
};

type RefundApi = {
  _id?: string;
  refundId?: string;
  claimId?: Ref;
  disputeId?: Ref;
  refundDetails?: {
    description?: string;
    amount?: number;
  };
  amount?: number;
  status?: string;
  paidInPayrollRunId?: Ref;
  updatedAt?: string;
};

type PayslipApi = {
  _id?: string;
  payrollRun?: string;
  employee?: string;
  earnings?: {
    baseSalary?: number;
    allowances?: { name?: string; amount?: number }[];
    bonuses?: { name?: string; amount?: number }[];
    benefits?: { name?: string; amount?: number }[];
    refunds?: { description?: string; amount?: number }[];
  };
  deductions?: {
    taxes?: { name?: string; rate?: number }[];
    insurances?: { name?: string; employeeRate?: number }[];
    penalties?: { reason?: string; amount?: number }[] | null;
  };
  netPay?: number;
  totalGrossSalary?: number;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

const api = sharedApi;

export async function getClaims(): Promise<ClaimRecord[]> {
  try {
    const res = await api.get("/claims");
    const items: ClaimApi[] = Array.isArray(res.data) ? res.data : [];
    return items.map((claim: ClaimApi): ClaimRecord => ({
      id: claim._id ?? claim.claimId ?? "N/A",
      claimId: claim.claimId ?? claim._id ?? "N/A",
      claimType: claim.claimType ?? "General",
      description: claim.description ?? "",
      employee: refToLabel(claim.employeeId) ?? "Unknown employee",
      amount: Number(claim.amount) || 0,
      approvedAmount:
        claim.approvedAmount !== undefined ? Number(claim.approvedAmount) : undefined,
      status: claim.status ?? "under review",
      financeOwner: refToLabel(claim.financeStaffId) ?? "Unassigned",
      updatedOn: claim.updatedAt
        ? new Date(claim.updatedAt).toISOString().split("T")[0]
        : "—",
      statusHistory: (claim.statusHistory ?? []).map((h) => ({
        status: h.status ?? "unknown",
        at: h.at ? new Date(h.at).toISOString() : "",
        note: h.note,
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch claims", error);
    throw error;
  }
}

export async function getDisputes(): Promise<DisputeRecord[]> {
  try {
    const res = await api.get("/disputes");
    const items: DisputeApi[] = Array.isArray(res.data) ? res.data : [];
    return items.map((dispute: DisputeApi): DisputeRecord => ({
      id: dispute._id ?? dispute.disputeId ?? "N/A",
      disputeId: dispute.disputeId ?? dispute._id ?? "N/A",
      description: dispute.description ?? "",
      employee: refToLabel(dispute.employeeId) ?? "Unknown employee",
      payslipId: dispute.payslipId ?? "Not linked",
      status: dispute.status ?? "under review",
      payrollOwner: refToLabel(dispute.payrollSpecialistId) ?? "Unassigned",
      updatedOn: dispute.updatedAt
        ? new Date(dispute.updatedAt).toISOString().split("T")[0]
        : "—",
      statusHistory: (dispute.statusHistory ?? []).map((h) => ({
        status: h.status ?? "unknown",
        at: h.at ? new Date(h.at).toISOString() : "",
        note: h.note,
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch disputes", error);
    throw error;
  }
}

export async function approveClaim(id: string, approvedAmount?: number, resolutionComment?: string) {
  await api.post(`/claims/${id}/approve`, { approvedAmount, resolutionComment });
}

export async function rejectClaim(id: string, rejectionReason?: string) {
  await api.post(`/claims/${id}/reject`, { rejectionReason });
}

export async function approveDispute(id: string, refundAmount?: number, resolutionComment?: string) {
  await api.post(`/disputes/${id}/approve`, { refundAmount, resolutionComment });
}

export async function rejectDispute(id: string, rejectionReason?: string) {
  await api.post(`/disputes/${id}/reject`, { rejectionReason });
}

export async function getRefunds(): Promise<RefundRecord[]> {
  try {
    const res = await api.get("/refunds");
    const items: RefundApi[] = Array.isArray(res.data) ? res.data : [];
    return items.map((refund: RefundApi): RefundRecord => {
      const hasClaim = Boolean(refund.claimId);
      const hasDispute = Boolean(refund.disputeId);
      return {
        refundId: refund.refundId ?? refund._id ?? "N/A",
        reference: hasClaim
          ? refToLabel(refund.claimId, "claimId") ?? "Claim"
          : hasDispute
          ? refToLabel(refund.disputeId, "disputeId") ?? "Dispute"
          : "Unlinked",
        referenceType: hasClaim ? "Claim" : "Dispute",
        reason: refund.refundDetails?.description ?? "Refund",
        amount: Number(refund.refundDetails?.amount ?? refund.amount ?? 0),
        status: refund.status ?? "pending",
        payrollRun: refToLabel(refund.paidInPayrollRunId, "runId") ?? "Unscheduled",
        updatedOn: refund.updatedAt
          ? new Date(refund.updatedAt).toISOString().split("T")[0]
          : "—",
      };
    });
  } catch (error) {
    console.error("Failed to fetch refunds", error);
    throw error;
  }
}

export async function getPayslips(): Promise<PayslipRecord[]> {
  const res = await api.get("/payslips");
  const items: PayslipApi[] = Array.isArray(res.data) ? res.data : [];
  return items.map((p) => ({
    id: p._id ?? "N/A",
    payrollRun: p.payrollRun,
    employee: p.employee,
    department: (p as any).department,
    contractType: (p as any).contractType,
    workType: (p as any).workType,
    baseSalary: Number(p.earnings?.baseSalary ?? 0),
    allowances: p.earnings?.allowances ?? [],
    transportAllowances: (p as any).earnings?.transportAllowances ?? [],
    bonuses: p.earnings?.bonuses ?? [],
    benefits: p.earnings?.benefits ?? [],
    leaveEncashment: (p as any).earnings?.leaveEncashment ?? [],
    refunds: p.earnings?.refunds ?? [],
    taxes: p.deductions?.taxes ?? [],
    insurances: p.deductions?.insurances ?? [],
    employerInsuranceContributions: (p as any).employerInsuranceContributions ?? [],
    penalties: p.deductions?.penalties ?? null,
    unpaidLeave: (p.deductions as any)?.unpaidLeave ?? [],
    netPay: Number(p.netPay ?? 0),
    totalGrossSalary: Number((p as any).totalGrossSalary ?? 0),
    totalDeductions: Number((p as any).totalDeductions ?? 0),
    status: p.paymentStatus ?? "pending",
    dispute: (p as any).dispute,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

export function getApiBaseUrl() {
  return api.defaults.baseURL;
}

function refToLabel(ref: Ref, idKey?: keyof RefShape): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  if (idKey && ref[idKey]) return String(ref[idKey]);
  return (
    ref.name ??
    ref.fullName ??
    ref.firstName ??
    ref._id ??
    (idKey ? (ref[idKey] as string | undefined) : undefined)
  );
}
