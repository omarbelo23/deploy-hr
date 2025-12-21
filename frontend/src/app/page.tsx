"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    // If authenticated, redirect to profile (or show dashboard)
    router.push("/profile");
  }, [router]);

  const configSections = [
    { href: '/payroll-config/policies', label: 'Payroll Policies', description: 'Configure company-level payroll policies' },
    { href: '/payroll-config/pay-grades', label: 'Pay Grades', description: 'Define pay grades, salary, and compensation limits' },
    { href: '/payroll-config/pay-types', label: 'Pay Types', description: 'Define employee pay types (hourly, daily, weekly, monthly)' },
    { href: '/payroll-config/allowances', label: 'Allowances', description: 'Set allowances (transportation, housing, etc)' },
    { href: '/payroll-config/tax-rules', label: 'Tax Rules', description: 'Define tax rules and laws' },
    { href: '/payroll-config/insurance', label: 'Insurance Brackets', description: 'Configure insurance brackets with salary ranges' },
    { href: '/payroll-config/signing-bonuses', label: 'Signing Bonuses', description: 'Configure policies for signing bonuses' },
    { href: '/payroll-config/termination-benefits', label: 'Termination Benefits', description: 'Configure resignation and termination benefits' },
    { href: '/payroll-config/company-settings', label: 'Company Settings', description: 'Set company-wide settings (pay dates, time zone, currency)' },
  ];

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
