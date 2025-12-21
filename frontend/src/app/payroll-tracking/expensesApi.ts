import type { ClaimRecord } from "./data";
import { api as sharedApi } from "@/lib/api";

const api = sharedApi;

export async function getExpenses(): Promise<ClaimRecord[]> {
  const res = await api.get("/expenses");
  return (Array.isArray(res.data) ? res.data : []).map((claim: any) => ({
    id: claim._id ?? claim.claimId ?? "N/A",
    claimId: claim.claimId ?? claim._id ?? "N/A",
    claimType: claim.claimType ?? "expense",
    description: claim.description ?? "",
    employee: claim.employeeId?.fullName ?? claim.employeeId ?? "Unknown employee",
    amount: Number(claim.amount ?? 0),
    approvedAmount: claim.approvedAmount !== undefined ? Number(claim.approvedAmount) : undefined,
    status: claim.status ?? "under review",
    financeOwner: claim.financeStaffId?.fullName ?? claim.financeStaffId ?? "Unassigned",
    updatedOn: claim.updatedAt
      ? new Date(claim.updatedAt).toISOString().split("T")[0]
      : "—",
    statusHistory: (claim.statusHistory ?? []).map((h: any) => ({
      status: h.status ?? "unknown",
      at: h.at ? new Date(h.at).toISOString() : "",
      note: h.note,
    })),
    expenseDetails: claim.expenseDetails,
  }));
}

export async function createExpense(payload: {
  claimId: string;
  description: string;
  amount: number;
  category?: string;
  merchant?: string;
  incurredAt?: string;
  receipts?: string[];
}) {
  await api.post("/expenses", {
    claimId: payload.claimId,
    description: payload.description,
    amount: payload.amount,
    claimType: "expense",
    expenseDetails: {
      category: payload.category,
      merchant: payload.merchant,
      incurredAt: payload.incurredAt,
      receipts: payload.receipts,
    },
  });
}
