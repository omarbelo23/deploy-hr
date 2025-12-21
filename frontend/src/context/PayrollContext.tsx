"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { PayrollCycle, PayrollCycleStatus } from '@/types/payroll-execution';

interface PayrollContextType {
  currentCycle: PayrollCycle | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setCurrentCycle: (cycle: PayrollCycle | null) => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

interface PayrollProviderProps {
  children: ReactNode;
}

export function PayrollProvider({ children }: PayrollProviderProps) {
  const [currentCycle, setCurrentCycle] = useState<PayrollCycle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await axios.get(`${baseUrl}/payroll-execution/current`, { headers });
      setCurrentCycle(response.data);
    } catch (err) {
      console.error('Failed to refresh payroll data:', err);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, []);

  const value: PayrollContextType = {
    currentCycle,
    loading,
    error,
    refreshData,
    setCurrentCycle,
  };

  return (
    <PayrollContext.Provider value={value}>
      {children}
    </PayrollContext.Provider>
  );
}

export function usePayroll(): PayrollContextType {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
}
