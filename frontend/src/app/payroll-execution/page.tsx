"use client";

import React from 'react';
import axios from 'axios';
import Link from 'next/link';
import { StatusCard } from '@/components/payroll-execution/StatusCard';

type PayrollStatus = 'Draft' | 'Review' | 'Approved' | 'Paid' | 'Rejected';

export default function PayrollExecutionPage() {
    const [statusData, setStatusData] = React.useState<{
        status: PayrollStatus;
        cyclePeriod: string;
        employeeCount: number;
        totalAmount: number;
    } | null>(null);

    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token =
                    typeof window !== 'undefined'
                        ? localStorage.getItem('access_token')
                        : null;

                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const baseUrl =
                    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

                const response = await axios.get(
                    `${baseUrl}/payroll-execution/status`,
                    { headers }
                );

                setStatusData(response.data);
            } catch (err) {
                console.error('Failed to fetch payroll status:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    const getActionLink = () => {
        if (!statusData) return '#';

        switch (statusData.status) {
            case 'Draft':
            case 'Rejected':
                return '/payroll-execution/initiate';
            case 'Review':
                return '/payroll-execution/review/current';
            default:
                return '#';
        }
    };

    const getActionLabel = () => {
        if (!statusData) return 'Loading...';

        switch (statusData.status) {
            case 'Draft':
                return 'Continue Initiation';
            case 'Rejected':
                return 'Restart Initiation';
            case 'Review':
                return 'Go to Review';
            case 'Approved':
            case 'Paid':
                return 'View Summary';
            default:
                return 'Details';
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading payroll status...</div>;
    }

    if (!statusData) {
        return (
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold">Payroll Execution</h1>
                <p className="text-gray-500 mt-2">No active payroll cycle.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Payroll Execution
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage and track your payroll cycles.
                    </p>
                </div>

                <div className="flex space-x-4">
                    {/* Existing dynamic button */}
                    <Link href={getActionLink()}>
                        <button className="bg-[#0B1120] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                            {getActionLabel()}
                        </button>
                    </Link>

                    {/* Dedicated Initiate Payroll button */}
                    <Link href="/payroll-execution/initiate">
                        <button className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">
                            Initiate Payroll
                        </button>
                    </Link>
                </div>
            </div>

            <StatusCard
                status={statusData.status}
                cyclePeriod={statusData.cyclePeriod}
                employeeCount={statusData.employeeCount}
                totalAmount={statusData.totalAmount || 0} // added fallback to avoid runtime error
            />
        </div>
    );
}
