"use client"; // ⚡ Make the whole layout client-only

import React, { useState, useEffect } from 'react';
import { PayrollProvider } from '@/context/PayrollContext';
import { AppShell } from '@/components/layout/app-shell';

export default function PayrollExecutionLayout({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null; // Don’t render on server

  return (
    <PayrollProvider>
      <AppShell title="Payroll Execution" subtitle="Manage and process payroll cycles">
        {children}
      </AppShell>
    </PayrollProvider>
  );
}
