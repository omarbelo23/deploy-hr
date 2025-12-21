"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correctionApi, attendanceApi } from "@/lib/api/time-management";
import { AttendanceCorrectionRequest, CorrectionStatus } from "@/types/time-management";
import { getCurrentUser, hasAnyPermission } from "@/lib/auth";
import { Permission } from "@/types/permissions";
import { employeeApi } from "@/lib/api/employee-api";
import { Plus, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import type { AuthPayload } from "@/types/auth";

export default function CorrectionsPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [employees, setEmployees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fetchingRecord, setFetchingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    attendanceRecord: "",
    reason: "",
    employeeId: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser?.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: currentUser.employeeId || "" }));
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, []);

  // Fetch employee names for the list
  useEffect(() => {
    const fetchEmployeeNames = async () => {
      const uniqueIds = Array.from(new Set(requests.map(r => r.employeeId)));
      const missingIds = uniqueIds.filter(id => !employees[id]);

      if (missingIds.length === 0) return;

      try {
        const newEmployees: Record<string, string> = { ...employees };
        await Promise.all(missingIds.map(async (id: any) => {
          try {
            const emp = await employeeApi.getEmployeeById(id as string);
            newEmployees[id as string] = `${emp.firstName} ${emp.lastName}`;
          } catch (e) {
            newEmployees[id as string] = `ID: ${(id as string).slice(-6)}`;
          }
        }));
        setEmployees(newEmployees);
      } catch (error) {
        console.error("Failed to fetch employee names:", error);
      }
    };

    if (requests.length > 0) {
      fetchEmployeeNames();
    }
  }, [requests]);

  // Fetch attendance record when date changes
  useEffect(() => {
    if (user?.employeeId && selectedDate && dialogOpen) {
      fetchAttendanceByDate(selectedDate);
    }
  }, [selectedDate, user?.employeeId, dialogOpen]);

  const fetchAttendanceByDate = async (date: string) => {
    if (!user?.employeeId) return;

    setFetchingRecord(true);
    setRecordError(null);
    try {
      const record = await attendanceApi.getAttendanceByDate(date, user.employeeId);
      if (record) {
        setFormData(prev => ({ ...prev, attendanceRecord: record._id }));
      } else {
        setFormData(prev => ({ ...prev, attendanceRecord: "" }));
        setRecordError("No attendance record found for this date. Please select a different date.");
      }
    } catch (error: any) {
      console.error("Failed to fetch attendance record:", error);
      setFormData(prev => ({ ...prev, attendanceRecord: "" }));
      const status = error?.response?.status;
      if (status === 403) {
        setRecordError(
          "You don't have permission to view attendance records."
        );
      } else if (status === 404) {
        setRecordError("No attendance record found for this date.");
      } else {
        setRecordError("Failed to fetch attendance record.");
      }
    } finally {
      setFetchingRecord(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await correctionApi.getAllRequests();
      setRequests(data);
    } catch (error: any) {
      console.error("Failed to load correction requests:", error);
      const status = error?.response?.status;
      if (status === 403) {
        toast.error("You don't have permission to view correction requests.");
      } else {
        toast.error("Failed to load correction requests.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.attendanceRecord) {
      toast.error("Please select a date with a valid attendance record.");
      return;
    }

    try {
      await correctionApi.createRequest({
        ...formData,
        employeeId: user?.employeeId || formData.employeeId,
      });
      toast.success("Correction request submitted successfully!");
      await loadRequests();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Failed to create correction request:", error);
      const message = error?.response?.data?.message || error?.message;
      toast.error(message || "Failed to create correction request.");
    }
  };

  const handleApproveByManager = async (id: string) => {
    try {
      await correctionApi.approveByManager(id);
      toast.success("Approved by manager");
      await loadRequests();
    } catch (error: any) {
      toast.error("Failed to approve request.");
    }
  };

  const handleApproveByHR = async (id: string) => {
    try {
      await correctionApi.approveByHR(id);
      toast.success("Approved by HR");
      await loadRequests();
    } catch (error: any) {
      toast.error("Failed to approve request.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await correctionApi.reject(id);
      toast.success("Request rejected");
      await loadRequests();
    } catch (error: any) {
      toast.error("Failed to reject request.");
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setRecordError(null);
    setFormData({
      attendanceRecord: "",
      reason: "",
      employeeId: user?.employeeId || "",
    });
  };

  const getStatusBadge = (status: CorrectionStatus) => {
    switch (status) {
      case CorrectionStatus.SUBMITTED:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Manager</Badge>;
      case CorrectionStatus.IN_REVIEW:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending HR</Badge>;
      case CorrectionStatus.APPROVED:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>;
      case CorrectionStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canApproveAsManager = user && hasAnyPermission(user, [
    Permission.APPROVE_LEAVES,
    Permission.VIEW_TEAM_ATTENDANCE
  ]);
  const canApproveAsHR = user && hasAnyPermission(user, [Permission.MANAGE_ATTENDANCE]);

  return (
    <AppShell title="Attendance Corrections">
      <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Corrections</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage corrections submitted by your team
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl px-6">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Request Attendance Correction</DialogTitle>
                <DialogDescription>
                  Select a date to correct your attendance record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date of Correction</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    required
                    className="rounded-lg"
                  />
                </div>
                {fetchingRecord && (
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-pulse" />
                    Locating attendance record...
                  </div>
                )}
                {recordError && (
                  <div className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive border border-destructive/10">
                    {recordError}
                  </div>
                )}
                {!fetchingRecord && formData.attendanceRecord && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-100 flex items-center gap-2 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Attendance record found
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Correction</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Forgot to clock out, Technical issue"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.attendanceRecord} className="rounded-xl px-8">
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                Request Queue
              </CardTitle>
              <CardDescription>
                {canApproveAsManager || canApproveAsHR
                  ? "Pending and historical requests across the organization"
                  : "Track the status of your submitted corrections"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white">{requests.length} Total</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-900 font-semibold text-lg">No requests yet</p>
              <p className="text-slate-500 mt-1">Pending corrections will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                    <TableHead className="py-4 pl-6">Employee</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right pr-6">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id} className="group transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {employees[request.employeeId] || "Loading..."}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                              ID: {request.employeeId.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-slate-600 max-w-[200px] truncate" title={request.reason}>
                          {request.reason || <span className="text-slate-300 italic">No reason provided</span>}
                        </p>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-slate-500 tabular-nums">
                        {request.createdAt ? format(new Date(request.createdAt), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {request.status === CorrectionStatus.SUBMITTED && canApproveAsManager && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg"
                              onClick={() => handleApproveByManager(request._id)}
                            >
                              Manager Appr.
                            </Button>
                          )}
                          {request.status === CorrectionStatus.IN_REVIEW && canApproveAsHR && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg"
                              onClick={() => handleApproveByHR(request._id)}
                            >
                              HR Appr.
                            </Button>
                          )}
                          {(request.status === CorrectionStatus.SUBMITTED ||
                            request.status === CorrectionStatus.IN_REVIEW) &&
                            (canApproveAsManager || canApproveAsHR) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600 rounded-lg"
                                onClick={() => handleReject(request._id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
