"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, MetricCard, SectionCard, StatusPill } from "../components";
import { getRefunds } from "../api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getRefunds();
        if (!isMounted) return;
        setRefunds(data);
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load refunds.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const paid = useMemo(
    () => refunds.filter((r) => r.status === "paid").length,
    [refunds],
  );
  const pending = useMemo(() => refunds.length - paid, [refunds, paid]);

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pending refunds"
          value={pending.toString()}
          hint="Queued for the next payroll run"
          accent="amber"
        />
        <MetricCard
          label="Paid this cycle"
          value={paid.toString()}
          hint="Cleared with payroll"
          accent="emerald"
        />
        <MetricCard
          label="Largest pending"
          value={
            refunds.length
              ? currency.format(Math.max(...refunds.map((r) => r.amount)))
              : currency.format(0)
          }
          hint="Based on current list"
          accent="indigo"
        />
        <MetricCard
          label="Next payroll run"
          value={refunds[0]?.payrollRun ?? "Not scheduled"}
          hint="From top of queue"
          accent="rose"
        />
      </div>

      <SectionCard
        title="Refund schedule"
        description="Visibility into refunds tied to claims and disputes"
      >
        <DataTable
          columns={[
            { key: "refundId", label: "Refund" },
            {
              key: "reference",
              label: "Reference",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">
                    {row.reference} <span className="text-xs text-slate-300">({row.referenceType})</span>
                  </p>
                  <p className="text-xs text-slate-300">{row.reason}</p>
                </div>
              ),
            },
            {
              key: "amount",
              label: "Amount",
              render: (row) => currency.format(row.amount),
            },
            {
              key: "payrollRun",
              label: "Payroll run",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{row.payrollRun ?? "Unscheduled"}</p>
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
              key: "history",
              label: "History",
              render: (row) => (
                <div className="text-xs text-slate-300">
                  <p>Created → {row.referenceType}</p>
                  <p>
                    Payment:{" "}
                    {row.status === "paid"
                      ? "Included in payroll"
                      : "Pending finance approval / payroll run"}
                  </p>
                </div>
              ),
            },
          ]}
          rows={refunds}
          empty="No refunds in the queue"
        />
      </SectionCard>
    </div>
  );
}
