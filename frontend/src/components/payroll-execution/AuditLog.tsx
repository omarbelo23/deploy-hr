// src/components/payroll-execution/AuditLog.tsx
import { AuditLogEntry } from "@/types/payroll-execution";

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export function AuditLog({ logs }: AuditLogProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">Audit Trail & History</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {logs.map((log, idx) => (
            <div key={idx} className="relative flex gap-6 group">
              {/* Timeline Line */}
              {idx !== logs.length - 1 && (
                <div className="absolute left-[5.5rem] top-8 bottom-[-1.5rem] w-px bg-slate-200 group-hover:bg-slate-300 transition-colors" />
              )}
              
              {/* Timestamp */}
              <div className="w-24 text-xs font-mono text-slate-400 pt-1 text-right shrink-0">
                {log.timestamp.split(',')[0]} <br/>
                {log.timestamp.split(',')[1]}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-700 text-sm">{log.user}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    {log.action.replace(/_/g, " ")}
                  </span>
                </div>
                
                {/* Conditional Rendering for Justification */}
                {log.reason ? (
                  <div className="mt-2 text-sm bg-red-50 border border-red-100 p-3 rounded-md text-slate-700">
                    <span className="font-semibold text-red-800 text-xs uppercase tracking-wide block mb-1">Justification Provided:</span>
                    "{log.reason}"
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Action logged successfully.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}