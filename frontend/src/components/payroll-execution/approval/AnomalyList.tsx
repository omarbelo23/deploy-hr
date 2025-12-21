
import React from "react";
import { AlertCircle } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PayrollAnomaly } from "@/types/payroll-execution";

interface AnomalyListProps {
    anomalies: PayrollAnomaly[];
}

export function AnomalyList({ anomalies }: AnomalyListProps) {
    if (!anomalies || anomalies.length === 0) {
        return null;
    }

    return (
        <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <CardTitle>Anomalies Detected</CardTitle>
                </div>
                <CardDescription>
                    The following employees have payroll anomalies that require attention.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {anomalies.map((anomaly, index) => (
                            <div
                                key={`${anomaly.employeeId}-${index}`}
                                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {anomaly.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {anomaly.issue}
                                    </p>
                                </div>
                                <div className="text-xs text-muted-foreground bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                                    High Risk
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
