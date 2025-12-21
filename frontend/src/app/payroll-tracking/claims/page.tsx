"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, MetricCard, SectionCard, StatusPill } from "../components";
import { getClaims } from "../api";
import { ClaimActions } from "../actions";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getClaims();
        if (!isMounted) return;
        setClaims(data);
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load claims.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const approved = useMemo(
    () => claims.filter((c) => c.status === "approved").length,
    [claims],
  );
  const rejected = useMemo(
    () => claims.filter((c) => c.status === "rejected").length,
    [claims],
  );
  const waiting = useMemo(
    () => Math.max(claims.length - approved - rejected, 0),
    [claims, approved, rejected],
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
          label="Open claims"
          value={waiting.toString()}
          hint="Under review or pending approval"
          accent="emerald"
        />
        <MetricCard
          label="Approved"
          value={approved.toString()}
          hint="Ready for payout"
          accent="indigo"
        />
        <MetricCard
          label="Rejected"
          value={rejected.toString()}
          hint="With feedback shared"
          accent="rose"
        />
      </div>

      <SectionCard
        title="Claims queue"
        description="Full list of employee claims with finance ownership"
      >
        <DataTable
          columns={[
            {
              key: "claimId",
              label: "Claim",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{row.claimId}</p>
                  <p className="text-xs text-slate-300">{row.claimType}</p>
                </div>
              ),
            },
            { key: "employee", label: "Employee" },
            {
              key: "description",
              label: "Description",
              className: "max-w-md",
            },
            {
              key: "amount",
              label: "Amount",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{currency.format(row.amount)}</p>
                  {row.approvedAmount !== undefined ? (
                    <p className="text-xs text-emerald-200">
                      Approved: {currency.format(row.approvedAmount)}
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "financeOwner",
              label: "Finance",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{row.financeOwner}</p>
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
              render: (row) => <ClaimActions claim={row} />,
            },
          ]}
          rows={claims}
          empty="No claims yet"
        />
      </SectionCard>
    </div>
  );
}
