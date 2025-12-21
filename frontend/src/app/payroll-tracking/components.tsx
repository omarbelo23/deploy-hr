import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("approved") || normalized.includes("paid")
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : normalized.includes("pending") || normalized.includes("under")
      ? "bg-amber-50 text-amber-700 border border-amber-100"
      : normalized.includes("rejected")
      ? "bg-rose-50 text-rose-700 border border-rose-100"
      : "bg-slate-100 text-slate-700 border border-slate-200";

  return (
    <Badge className={`capitalize ${tone}`} variant="secondary">
      {status}
    </Badge>
  );
}

export function SectionCard({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {actionHref && actionLabel ? (
            <Button asChild variant="outline" size="sm">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "amber" | "indigo" | "rose";
}) {
  const accents: Record<string, string> = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-900",
    rose: "border-rose-100 bg-rose-50 text-rose-900",
  };

  const accentClass = accent ? accents[accent] : "bg-card";

  return (
    <Card className={`shadow-sm ${accentClass}`}>
      <CardContent className="space-y-2 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

type Column<T> = {
  key: keyof T;
  label: string;
  className?: string;
  render?: (item: T) => ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)} className={col.className}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground"
              >
                {empty ?? "No records yet"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className={col.className}>
                    {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
