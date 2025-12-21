
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PayrollCycleStatus } from "@/types/payroll-execution";
import { CheckCircle, XCircle, Unlock, PlayCircle } from "lucide-react";

interface ApprovalActionsProps {
    status: PayrollCycleStatus | string;
    canApprove: boolean;
    canExecute: boolean;
    onApprove: () => void;
    onReject: (reason: string) => void;
    onUnfreeze: (reason: string) => void;
    onExecute: () => void;
    loading?: boolean;
}

export function ApprovalActions({
    status,
    canApprove,
    canExecute,
    onApprove,
    onReject,
    onUnfreeze,
    onExecute,
    loading = false,
}: ApprovalActionsProps) {
    const [rejectReason, setRejectReason] = useState("");
    const [unfreezeReason, setUnfreezeReason] = useState("");
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isUnfreezeOpen, setIsUnfreezeOpen] = useState(false);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isExecuteOpen, setIsExecuteOpen] = useState(false);

    const handleReject = () => {
        if (rejectReason.trim()) {
            onReject(rejectReason);
            setRejectReason("");
            setIsRejectOpen(false);
        }
    };

    const handleUnfreeze = () => {
        if (unfreezeReason.trim()) {
            onUnfreeze(unfreezeReason);
            setUnfreezeReason("");
            setIsUnfreezeOpen(false);
        }
    };

    // If cycle is PAID, usually no actions are available
    if (status === PayrollCycleStatus.PAID) {
        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Payroll Cycle Completed and Paid</span>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/30 rounded-lg border">
            {/* Approval & Rejection Flow */}
            {canApprove && (
                <>
                    <Button
                        variant="default"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => setIsApproveOpen(true)}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Approve Cycle
                    </Button>

                    <AlertDialog
                        open={isApproveOpen}
                        onOpenChange={setIsApproveOpen}
                        title="Approve Payroll Cycle?"
                        description="This will lock the payroll data and mark it as ready for payment execution. Are you sure you have reviewed all anomalies and summaries?"
                        confirmText={loading ? "Processing..." : "Confirm Approval"}
                        onConfirm={onApprove}
                    />

                    <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => setIsRejectOpen(true)}
                    >
                        <XCircle className="h-4 w-4" />
                        Reject Cycle
                    </Button>

                    <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Reject Payroll Cycle</DialogTitle>
                                <DialogDescription>
                                    Please provide a reason for rejecting this payroll cycle. This
                                    will send it back to draft/review status.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="reject-reason">Reason</Label>
                                    <Textarea
                                        id="reject-reason"
                                        placeholder="e.g., Incorrect bonus calculations for IT dept."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || loading}
                                    variant="destructive"
                                >
                                    {loading ? "Rejecting..." : "Confirm Rejection"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {/* Unfreeze Flow */}
            {status === PayrollCycleStatus.WAITING_FINANCE_APPROVAL && (
                <>
                    <Button
                        variant="outline"
                        className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                        onClick={() => setIsUnfreezeOpen(true)}
                    >
                        <Unlock className="h-4 w-4" />
                        Unfreeze / Revert
                    </Button>

                    <Dialog open={isUnfreezeOpen} onOpenChange={setIsUnfreezeOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Unfreeze Payroll Cycle</DialogTitle>
                                <DialogDescription>
                                    This action will revert the status to 'Under Review' and allow
                                    modifications.
                                    <strong> Justification is mandatory.</strong>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="unfreeze-reason">Justification</Label>
                                    <Textarea
                                        id="unfreeze-reason"
                                        placeholder="e.g., Late submission of overtime hours."
                                        value={unfreezeReason}
                                        onChange={(e) => setUnfreezeReason(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsUnfreezeOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUnfreeze}
                                    disabled={!unfreezeReason.trim() || loading}
                                    variant="default"
                                >
                                    {loading ? "Processing..." : "Unfreeze"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {/* Execution Flow */}
            {canExecute && (
                <>
                    <Button
                        size="lg"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 ml-auto shadow-sm"
                        onClick={() => setIsExecuteOpen(true)}
                    >
                        <PlayCircle className="h-5 w-5" />
                        Execute Payment
                    </Button>

                    <AlertDialog
                        open={isExecuteOpen}
                        onOpenChange={setIsExecuteOpen}
                        title="Execute Final Payment?"
                        description="This will initiate the bank transfer process and mark the cycle as PAID. This action cannot be undone."
                        confirmText={loading ? "Executing..." : "Confirm Payment"}
                        onConfirm={onExecute}
                    />
                </>
            )}
        </div>
    );
}
