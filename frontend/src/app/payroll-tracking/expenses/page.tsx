"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, MetricCard, SectionCard, StatusPill } from "../components";
import { createExpense, getExpenses } from "../expensesApi";
import { ClaimActions } from "../actions";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ExpensesPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    claimId: "",
    description: "",
    amount: "",
    category: "",
    merchant: "",
    incurredAt: "",
    receipts: "",
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getExpenses();
        if (!isMounted) return;
        setClaims(data);
      } catch (err: any) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load expenses.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const submitExpense = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createExpense({
        claimId: form.claimId || `EXP-${Date.now()}`,
        description: form.description,
        amount: Number(form.amount || 0),
        category: form.category || undefined,
        merchant: form.merchant || undefined,
        incurredAt: form.incurredAt || undefined,
        receipts: form.receipts
          ? form.receipts.split(",").map((r) => r.trim()).filter(Boolean)
          : undefined,
      });
      setForm({
        claimId: "",
        description: "",
        amount: "",
        category: "",
        merchant: "",
        incurredAt: "",
        receipts: "",
      });
      const refreshed = await getExpenses();
      setClaims(refreshed);
    } catch (err: any) {
      setError(err?.message || "Failed to submit expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const awaitingFinance = useMemo(
    () => claims.filter((c) => c.status?.toLowerCase().includes("finance")).length,
    [claims],
  );
  const approved = useMemo(
    () => claims.filter((c) => c.status?.toLowerCase() === "approved").length,
    [claims],
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
          label="Expenses"
          value={claims.length.toString()}
          hint="All expense claims"
          accent="indigo"
        />
        <MetricCard
          label="Awaiting finance"
          value={awaitingFinance.toString()}
          hint="Need finance approval"
          accent="amber"
        />
        <MetricCard
          label="Approved"
          value={approved.toString()}
          hint="Ready for refund"
          accent="emerald"
        />
      </div>

      <SectionCard title="Expense claims" description="Receipts, merchants, and approval trail">
        <form onSubmit={submitExpense} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm"
            placeholder="Claim ID (optional)"
            value={form.claimId}
            onChange={(e) => setForm((f) => ({ ...f, claimId: e.target.value }))}
          />
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm"
            placeholder="Description"
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm"
            placeholder="Amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm"
            placeholder="Category (e.g., Travel, Meals)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm"
            placeholder="Merchant"
            value={form.merchant}
            onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
          />
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm"
            placeholder="Incurred date"
            type="date"
            value={form.incurredAt}
            onChange={(e) => setForm((f) => ({ ...f, incurredAt: e.target.value }))}
          />
          <input
            className="rounded border bg-white/5 px-3 py-2 text-sm md:col-span-2"
            placeholder="Receipt URLs (comma separated)"
            value={form.receipts}
            onChange={(e) => setForm((f) => ({ ...f, receipts: e.target.value }))}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit expense"}
          </button>
        </form>
        <DataTable
          columns={[
            { key: "claimId", label: "Claim" },
            { key: "employee", label: "Employee" },
            {
              key: "expenseDetails",
              label: "Expense",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold">{row.expenseDetails?.category ?? "Expense"}</p>
                  <p className="text-xs text-slate-300">
                    {row.expenseDetails?.merchant ?? "—"} • {row.expenseDetails?.incurredAt ?? "N/A"}
                  </p>
                  {row.expenseDetails?.receipts?.length ? (
                    <p className="text-xs text-slate-400">
                      Receipts: {row.expenseDetails.receipts.length}
                    </p>
                  ) : null}
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
          empty={loading ? "Loading..." : "No expenses submitted"}
        />
      </SectionCard>
    </div>
  );
}
