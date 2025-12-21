 "use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DataTable,
  MetricCard,
  SectionCard,
  StatusPill,
} from "./components";
import { getApiBaseUrl, getClaims, getDisputes, getRefunds } from "./api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function PayrollTrackingPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [c, d, r] = await Promise.all([
          getClaims().catch((err) => {
            if (err?.response?.status === 401) throw err;
            return [];
          }),
          getDisputes().catch((err) => {
            if (err?.response?.status === 401) throw err;
            return [];
          }),
          getRefunds().catch((err) => {
            if (err?.response?.status === 401) throw err;
            return [];
          }),
        ]);
        if (!isMounted) return;
        setClaims(c);
        setDisputes(d);
        setRefunds(r);
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load payroll tracking data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const apiBase = getApiBaseUrl();

  const openClaims = useMemo(
    () =>
      claims.filter(
        (c) => c.status !== "approved" && c.status !== "rejected",
      ).length,
    [claims],
  );

  const openDisputes = useMemo(
    () =>
      disputes.filter(
        (d) => d.status !== "approved" && d.status !== "rejected",
      ).length,
    [disputes],
  );

  const pendingRefunds = useMemo(
    () => refunds.filter((r) => r.status !== "paid").length,
    [refunds],
  );

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="border bg-white shadow-sm">
        <CardHeader className="gap-4 sm:flex sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Overview
            </p>
            <CardTitle className="text-2xl">Payroll tracking</CardTitle>
            <CardDescription className="max-w-2xl">
              Monitor employee claims, disputes, and refunds in one view. Use the quick links to drill into each queue.
            </CardDescription>
            <div className="flex flex-wrap gap-2 text-xs">
              <BadgePill text="Finance + Payroll visibility" />
              <BadgePill text="Status-aware summaries" />
              <BadgePill text="Actionable quick links" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Open claims"
              value={openClaims.toString()}
              hint={`${claims.length} total`}
              accent="emerald"
            />
            <MetricCard
              label="Pending refunds"
              value={pendingRefunds.toString()}
              hint={`${refunds.length} total`}
              accent="amber"
            />
            <MetricCard
              label="Disputes in play"
              value={openDisputes.toString()}
              hint={`${disputes.length} total`}
              accent="indigo"
            />
            <MetricCard
              label="Latest payout"
              value={
                refunds.length
                  ? currency.format(refunds[0].amount)
                  : currency.format(0)
              }
              hint={
                refunds.length
                  ? `Run ${refunds[0].payrollRun}`
                  : "No payroll run scheduled"
              }
              accent="rose"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Claims"
          description="Newest submissions across employees"
          actionHref="/payroll-tracking/claims"
          actionLabel="View claims"
        >
          <DataTable
            columns={[
              { key: "claimId", label: "ID" },
              { key: "employee", label: "Employee" },
              { key: "description", label: "Description", className: "max-w-xs" },
              {
                key: "amount",
                label: "Amount",
                render: (row) => currency.format(row.amount),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusPill status={row.status} />,
              },
            ]}
            rows={claims.slice(0, 3)}
            empty="No claims captured"
          />
        </SectionCard>

        <SectionCard
          title="Refunds"
          description="Scheduled or completed payouts"
          actionHref="/payroll-tracking/refunds"
          actionLabel="View refunds"
        >
          <DataTable
            columns={[
              { key: "refundId", label: "ID" },
              {
                key: "reference",
                label: "Linked to",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="font-semibold">{row.reference}</p>
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
                key: "status",
                label: "Status",
                render: (row) => <StatusPill status={row.status} />,
              },
            ]}
            rows={refunds.slice(0, 3)}
            empty="No refunds queued"
          />
        </SectionCard>

        <SectionCard
          title="Disputes"
          description="Issues raised against payroll runs"
          actionHref="/payroll-tracking/disputes"
          actionLabel="View disputes"
        >
          <DataTable
            columns={[
              { key: "disputeId", label: "ID" },
              { key: "employee", label: "Employee" },
              { key: "payslipId", label: "Payslip" },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusPill status={row.status} />,
              },
            ]}
            rows={disputes.slice(0, 4)}
            empty="No disputes active"
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Live activity"
        description="Real-time events can be pulled once an activity feed endpoint is exposed."
      >
        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          No activity feed endpoint is connected yet. Expose a feed from the backend (e.g. recent claims/disputes/refunds updates) and hydrate this block.
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Button asChild variant="outline" size="sm">
            <a href={`${apiBase}/tax/document/${new Date().getFullYear()}`}>
              Download current year tax document
            </a>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function BadgePill({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      {text}
    </span>
  );
}
