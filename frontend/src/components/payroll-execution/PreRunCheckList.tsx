import React from 'react';

interface PreRunCheckListProps {
    checks: {
        id: string;
        description: string;
        resolved: boolean;
    }[];
    onToggleCheck: (id: string, resolved: boolean) => void;
}

export const PreRunCheckList: React.FC<PreRunCheckListProps> = ({ checks, onToggleCheck }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pre-Run Checks</h3>
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 divide-y divide-gray-200">
                {checks.map((check) => (
                    <div key={check.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                        <div className="flex items-center cursor-pointer" onClick={() => onToggleCheck(check.id, !check.resolved)}>
                            <div className={`flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${check.resolved ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                {check.resolved && (
                                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`ml-3 block text-sm font-medium ${check.resolved ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {check.description}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
