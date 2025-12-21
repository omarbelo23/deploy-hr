"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, MetricCard, SectionCard, StatusPill } from "../components";
import { getApiBaseUrl, getPayslips } from "../api";
import type { PayslipRecord } from "../data";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function PayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const apiBase = getApiBaseUrl();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPayslips();
        if (!mounted) return;
        setPayslips(data);
      } catch (err: any) {
        if (!mounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load payslips.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const netTotal = useMemo(
    () => payslips.reduce((sum, p) => sum + (p.netPay || 0), 0),
    [payslips],
  );
  const paid = useMemo(
    () => payslips.filter((p) => p.status?.toLowerCase().includes("paid")).length,
    [payslips],
  );

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Payslips"
          value={payslips.length.toString()}
          hint="Available to you"
          accent="indigo"
        />
        <MetricCard
          label="Paid"
          value={paid.toString()}
          hint="Cleared via payroll"
          accent="emerald"
        />
        <MetricCard
          label="Net total"
          value={currency.format(netTotal)}
          hint="Sum of listed payslips"
          accent="amber"
        />
      </div>

      <SectionCard
        title="Salary history"
        description="Base salary, benefits, deductions, employer contributions, and refunds per payroll run"
      >
        <DataTable
          columns={[
            { key: "payrollRun", label: "Run" },
            {
              key: "employee",
              label: "Employee",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{row.employee}</p>
                  <p className="text-xs text-slate-300">
                    {row.department ? `Dept: ${row.department}` : "Dept: —"}
                  </p>
                </div>
              ),
            },
            {
              key: "contractType",
              label: "Contract",
              render: (row) => (
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">{row.contractType ?? "—"}</p>
                  <p className="text-slate-300">{row.workType ?? ""}</p>
                </div>
              ),
            },
            {
              key: "baseSalary",
              label: "Base salary",
              render: (row) => currency.format(row.baseSalary),
            },
            {
              key: "allowances",
              label: "Allowances",
              render: (row) =>
                row.allowances?.length
                  ? currency.format(
                      row.allowances.reduce((s, a) => s + (a.amount ?? 0), 0),
                    )
                  : "—",
            },
            {
              key: "transportAllowances",
              label: "Transport",
              render: (row) =>
                row.transportAllowances?.length
                  ? currency.format(
                      row.transportAllowances.reduce((s, a) => s + (a.amount ?? 0), 0),
                    )
                  : "—",
            },
            {
              key: "leaveEncashment",
              label: "Leave encashment",
              render: (row) =>
                row.leaveEncashment?.length
                  ? currency.format(
                      row.leaveEncashment.reduce((s, a) => s + (a.amount ?? 0), 0),
                    )
                  : "—",
            },
            {
              key: "taxes",
              label: "Tax",
              render: (row) =>
                row.taxes?.length
                  ? `${row.taxes.map((t) => `${t.name ?? "Tax"} ${t.rate ?? 0}%`).join(", ")}`
                  : "—",
            },
            {
              key: "insurances",
              label: "Insurance (EE)",
              render: (row) =>
                row.insurances?.length
                  ? `${row.insurances
                      .map((i) => `${i.name ?? "Insurance"} ${i.employeeRate ?? 0}%`)
                      .join(", ")}`
                  : "—",
            },
            {
              key: "employerInsuranceContributions",
              label: "Insurance (ER)",
              render: (row) =>
                row.employerInsuranceContributions?.length
                  ? `${row.employerInsuranceContributions
                      .map((i) => `${i.name ?? "Insurance"} ${i.employerRate ?? 0}%`)
                      .join(", ")}`
                  : "—",
            },
            {
              key: "unpaidLeave",
              label: "Unpaid leave",
              render: (row) =>
                row.unpaidLeave?.length
                  ? currency.format(
                      row.unpaidLeave.reduce((s, a) => s + (a.amount ?? 0), 0),
                    )
                  : "—",
            },
            {
              key: "netPay",
              label: "Net pay",
              render: (row) => currency.format(row.netPay),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <div className="space-y-1">
                  <StatusPill status={row.status} />
                  {row.dispute ? (
                    <p className="text-xs text-amber-200">
                      Dispute {row.dispute.status} ({row.dispute.disputeId})
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "download" as keyof PayslipRecord,
              label: "Download",
              render: (row) => (
                <a
                  className="text-xs font-semibold text-primary underline"
                  href={`${apiBase}/payslips/${row.id}/download`}
                >
                  PDF
                </a>
              ),
            },
          ]}
          rows={payslips}
          empty={loading ? "Loading..." : "No payslips available"}
        />
      </SectionCard>
    </div>
  );
}
