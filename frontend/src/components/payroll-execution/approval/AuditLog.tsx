
import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuditLogEntry } from "@/types/payroll-execution";

interface AuditLogProps {
    logs: AuditLogEntry[];
}

export function AuditLog({ logs }: AuditLogProps) {
    if (!logs || logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                    <CardDescription>No actions recorded yet.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Sort logs by timestamp descending if not already
    const sortedLogs = [...logs].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>History of actions taken on this payroll cycle.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {sortedLogs.map((log, index) => (
                            <div
                                key={index}
                                className="flex flex-col space-y-1 border-l-2 border-muted pl-4 relative"
                            >
                                <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-primary" />
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">{log.action}</p>
                                    <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">by <span className="font-medium text-foreground">{log.user}</span></p>
                                {log.reason && (
                                    <div className="mt-1 bg-muted/50 p-2 rounded text-xs italic">
                                        "{log.reason}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
