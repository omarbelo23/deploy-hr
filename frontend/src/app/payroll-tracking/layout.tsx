'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

const tabs = [
  { href: "/payroll-tracking", label: "Overview" },
  { href: "/payroll-tracking/payslips", label: "Payslips" },
  { href: "/payroll-tracking/claims", label: "Claims" },
  { href: "/payroll-tracking/expenses", label: "Expenses" },
  { href: "/payroll-tracking/refunds", label: "Refunds" },
  { href: "/payroll-tracking/disputes", label: "Disputes" },
];

export default function PayrollTrackingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AppShell
      title="Payroll tracking"
      subtitle="Monitor payslips, claims, refunds, and disputes"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/payroll-tracking" &&
                pathname.startsWith(tab.href));

            return (
              <Button
                key={tab.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                size="sm"
              >
                <Link href={tab.href}>{tab.label}</Link>
              </Button>
            );
          })}
        </div>
        {children}
      </div>
    </AppShell>
  );
}
