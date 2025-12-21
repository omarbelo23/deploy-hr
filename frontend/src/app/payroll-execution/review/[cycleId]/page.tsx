"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { PayrollTable, EmployeePayroll } from '@/components/payroll-execution/PayrollTable';
import { CorrectionSheet, CorrectionData } from '@/components/payroll-execution/CorrectionSheet';
import { hasAnyRole, getToken } from '@/lib/auth';

export default function ReviewPage() {
    const router = useRouter();
    const params = useParams();
    const cycleId = params?.cycleId as string;

    const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<CorrectionData | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Fetch employees function (defined before useEffect that uses it)
    const fetchEmployees = async () => {
        try {
            const token = getToken() || localStorage.getItem("access_token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const baseUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

            const response = await axios.get(
                `${baseUrl}/payroll-execution/drafts/${cycleId}`,
                { headers }
            );

            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch draft entries:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    // Authorization check
    useEffect(() => {
        const authorized = hasAnyRole([
            'Payroll Specialist',
            'Payroll Manager',
            'System Admin'
        ]);

        if (!authorized) {
            router.push('/payroll-execution');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    // Fetch employees when cycleId changes
    useEffect(() => {
        if (cycleId && isAuthorized) {
            fetchEmployees();
        }
    }, [cycleId, isAuthorized]);

    // Block render until auth check completes (AFTER all hooks)
    if (!isAuthorized) return null;

    const handleCorrect = (employee: EmployeePayroll) => {
        setSelectedEmployee({
            employeeId: employee.id,
            employeeName: employee.name,
            grossPay: employee.grossPay,
            taxes: employee.taxes,
            deductions: employee.deductions,
            netPay: employee.netPay
        });
        setIsSheetOpen(true);
    };

    const handleSaveCorrection = async (data: CorrectionData) => {
        try {
            const token = getToken() || localStorage.getItem("access_token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const baseUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

            await axios.patch(
                `${baseUrl}/payroll-execution/payslip/${data.employeeId}`,
                data,
                { headers }
            );

            await fetchEmployees();
            setIsSheetOpen(false);
            setSelectedEmployee(null);
        } catch (error) {
            console.error('Failed to save correction:', error);
            alert('Failed to save correction. Please try again.');
        }
    };

    const handlePublish = async () => {
        try {
            const token = getToken() || localStorage.getItem("access_token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const baseUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

            await axios.post(
                `${baseUrl}/payroll-execution/review`,
                {
                    runId: cycleId,
                    action: 'approve',
                    comments: 'Published for manager review'
                },
                { headers }
            );

            alert('Published for Manager Review!');
        } catch (error) {
            console.error('Failed to publish review:', error);
            alert('Failed to publish review. Please try again.');
        }
    };

    const hasErrors = employees.some(e => e.hasByAnomaly);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link
                        href="/payroll-execution"
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">
                        Review Payroll Draft
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Review employee payslips and correct anomalies.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Export Report
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={hasErrors}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg
                            ${hasErrors
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[#0B1120] hover:bg-gray-800'
                            }`}
                    >
                        Publish for Approval
                    </button>
                </div>
            </div>

            {hasErrors && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-red-800">
                        Attention Needed
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                        There are flagged entries that must be corrected before publishing.
                    </p>
                </div>
            )}

            <PayrollTable data={employees} onCorrect={handleCorrect} />

            <CorrectionSheet
                employee={selectedEmployee}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSave={handleSaveCorrection}
            />
        </div>
    );
}
