"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, MetricCard, SectionCard, StatusPill } from "../components";
import { getDisputes } from "../api";
import { DisputeActions } from "../actions";

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getDisputes();
        if (!isMounted) return;
        setDisputes(data);
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load disputes.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const underReview = useMemo(
    () =>
      disputes.filter((d) => d.status.toLowerCase().includes("review")).length,
    [disputes],
  );

  const escalated = useMemo(
    () =>
      disputes.filter((d) => d.status.toLowerCase().includes("pending")).length,
    [disputes],
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
          label="Under review"
          value={underReview.toString()}
          hint="Initial payroll checks"
          accent="indigo"
        />
        <MetricCard
          label="Awaiting manager"
          value={escalated.toString()}
          hint="Pending payroll manager approval"
          accent="amber"
        />
        <MetricCard
          label="Total disputes"
          value={disputes.length.toString()}
          hint="Current cycle"
          accent="emerald"
        />
      </div>

      <SectionCard
        title="Dispute log"
        description="Every dispute tied to its payslip and payroll owner"
      >
        <DataTable
          columns={[
            { key: "disputeId", label: "Dispute" },
            {
              key: "description",
              label: "Description",
              className: "max-w-md",
            },
            { key: "employee", label: "Employee" },
            { key: "payslipId", label: "Payslip" },
            {
              key: "payrollOwner",
              label: "Owner",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{row.payrollOwner}</p>
                  <p className="text-xs text-slate-300">Updated {row.updatedOn}</p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusPill status={row.status} />,
            },
            {
              key: "statusHistory",
              label: "History",
              render: (row) =>
                row.statusHistory && row.statusHistory.length ? (
                  <div className="space-y-1 text-xs text-slate-200 max-w-xs">
                    {row.statusHistory.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 flex-wrap">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold">
                          {h.status}
                        </span>
                        <span className="text-slate-400">
                          {h.at ? new Date(h.at).toLocaleDateString() : ""}
                        </span>
                        {h.note ? <span className="text-slate-300">• {h.note}</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => <DisputeActions dispute={row} />,
            },
          ]}
          rows={disputes}
          empty="No disputes opened"
        />
      </SectionCard>
    </div>
  );
}
