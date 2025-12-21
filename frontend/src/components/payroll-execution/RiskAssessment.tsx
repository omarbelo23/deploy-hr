// src/components/payroll-execution/RiskAssessment.tsx
import { PayrollAnomaly } from "@/types/payroll-execution";

interface RiskAssessmentProps {
  anomalies: PayrollAnomaly[];
}

export function RiskAssessment({ anomalies }: RiskAssessmentProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
      <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
        <div className="p-1 bg-amber-100 rounded text-amber-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="font-bold text-amber-900">Risk Assessment: Action Required</h3>
      </div>
      
      <div className="divide-y divide-amber-100">
        {anomalies.map((item) => (
          <div key={item.employeeId} className="px-6 py-4 flex items-start justify-between hover:bg-amber-50/30 transition-colors">
            <div>
              <p className="font-bold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {item.employeeId}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {item.issue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}