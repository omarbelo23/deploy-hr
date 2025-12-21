"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

// Correction Interface
export interface CorrectionData {
    employeeId: string;
    employeeName: string;
    grossPay: number;
    taxes: number;
    deductions: number;
    netPay: number;
}

interface CorrectionSheetProps {
    employee: CorrectionData | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CorrectionData) => void;
}

export const CorrectionSheet: React.FC<CorrectionSheetProps> = ({
    employee,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = React.useState<CorrectionData | null>(null);
    const [inputValues, setInputValues] = React.useState({
        grossPay: '',
        taxes: '',
        deductions: ''
    });

    React.useEffect(() => {
        if (employee) {
            setFormData({ ...employee });
            setInputValues({
                grossPay: employee.grossPay.toString(),
                taxes: employee.taxes.toString(),
                deductions: employee.deductions.toString()
            });
        }
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!formData) return;

        const { name, value } = e.target;
        setInputValues(prev => ({ ...prev, [name]: value }));

        const num = parseFloat(value);
        setFormData(prev =>
            prev
                ? { ...prev, [name]: isNaN(num) ? 0 : num }
                : null
        );
    };

    React.useEffect(() => {
        if (!formData) return;

        const net = formData.grossPay - formData.taxes - formData.deductions;
        if (net !== formData.netPay) {
            setFormData(prev => (prev ? { ...prev, netPay: net } : null));
        }
    }, [formData?.grossPay, formData?.taxes, formData?.deductions]);

    const handleSubmit = () => {
        if (formData) onSave(formData);
    };

    if (!employee || !formData || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Correct Payroll
                    </h3>
                    <button onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium">
                            Gross Pay
                        </label>
                        <input
                            type="number"
                            name="grossPay"
                            value={inputValues.grossPay}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">
                                Taxes
                            </label>
                            <input
                                type="number"
                                name="taxes"
                                value={inputValues.taxes}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">
                                Deductions
                            </label>
                            <input
                                type="number"
                                name="deductions"
                                value={inputValues.deductions}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <label className="text-sm text-gray-500">
                            Net Pay (Calculated)
                        </label>
                        <p className="text-2xl font-bold">
                            ${formData.netPay.toFixed(2)}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            Save Corrections
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
