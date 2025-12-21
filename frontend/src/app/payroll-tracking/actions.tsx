'use client';

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveClaim,
  approveDispute,
  rejectClaim,
  rejectDispute,
} from "./api";
import type { ClaimRecord, DisputeRecord } from "./data";

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "primary",
}: {
  label: string;
  onClick: () => Promise<void>;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-white text-slate-900 hover:shadow px-3 py-1.5"
      : "border border-white/40 text-white hover:bg-white/10 px-3 py-1.5";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full text-xs font-semibold transition ${styles} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

export function ClaimActions({ claim }: { claim: ClaimRecord }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const approve = (approvedAmount?: number) =>
    start(async () => {
      setError(null);
      try {
        await approveClaim(claim.id, approvedAmount);
        router.refresh();
      } catch (e: any) {
        setError("Failed to approve");
      }
    });

  const reject = () =>
    start(async () => {
      setError(null);
      try {
        await rejectClaim(claim.id);
        router.refresh();
      } catch (e: any) {
        setError("Failed to reject");
      }
    });

  if (["approved", "rejected"].includes(claim.status.toLowerCase())) {
    return <span className="text-xs text-slate-400">No actions</span>;
  }
  if (claim.status.toLowerCase().includes("pending payroll manager approval")) {
    return <span className="text-xs text-amber-200">Awaiting manager approval</span>;
  }
  if (claim.status.toLowerCase().includes("pending finance approval")) {
    return <span className="text-xs text-indigo-200">Awaiting finance approval</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <ActionButton
          label="Approve"
          onClick={async () => await approve(claim.approvedAmount ?? claim.amount)}
          disabled={pending}
        />
        <ActionButton
          label="Reject"
          variant="ghost"
          onClick={async () => await reject()}
          disabled={pending}
        />
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

export function DisputeActions({ dispute }: { dispute: DisputeRecord }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const approve = () =>
    start(async () => {
      setError(null);
      try {
        await approveDispute(dispute.id);
        router.refresh();
      } catch (e: any) {
        setError("Failed to approve");
      }
    });

  const reject = () =>
    start(async () => {
      setError(null);
      try {
        await rejectDispute(dispute.id);
        router.refresh();
      } catch (e: any) {
        setError("Failed to reject");
      }
    });

  if (["approved", "rejected"].includes(dispute.status.toLowerCase())) {
    return <span className="text-xs text-slate-400">No actions</span>;
  }
  if (dispute.status.toLowerCase().includes("pending payroll manager approval")) {
    return <span className="text-xs text-amber-200">Awaiting manager approval</span>;
  }
  if (dispute.status.toLowerCase().includes("pending finance approval")) {
    return <span className="text-xs text-indigo-200">Awaiting finance approval</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <ActionButton
          label="Approve"
          onClick={async () => await approve()}
          disabled={pending}
        />
        <ActionButton
          label="Reject"
          variant="ghost"
          onClick={async () => await reject()}
          disabled={pending}
        />
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
