"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timeExceptionApi, attendanceApi } from "@/lib/api/time-management";
import { TimeException, TimeExceptionType, TimeExceptionStatus, CreateTimeExceptionDto, AttendanceRecord } from "@/types/time-management";
import { getCurrentUser, hasAnyPermission } from "@/lib/auth";
import { Permission } from "@/types/permissions";
import { Plus, CheckCircle, XCircle, AlertTriangle, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { AuthPayload } from "@/types/auth";
import { EmployeeSelector } from "@/components/ui/employee-selector";
import { employeeApi } from "@/lib/api/employee-api";

export default function ExceptionsPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [exceptions, setExceptions] = useState<TimeException[]>([]);
  const [filteredExceptions, setFilteredExceptions] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [formData, setFormData] = useState<CreateTimeExceptionDto>({
    employeeId: "",
    type: TimeExceptionType.MISSED_PUNCH,
    attendanceRecordId: "",
    assignedTo: "",
    reason: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Automatically pre-fill employeeId for standard employees
    if (currentUser && !hasAnyPermission(currentUser, [Permission.MANAGE_ATTENDANCE, Permission.MANAGE_ALL_PROFILES])) {
      if (currentUser.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: currentUser.employeeId! }));
      }
    }
  }, []);

  const isAdmin = user && hasAnyPermission(user, [Permission.MANAGE_ATTENDANCE, Permission.MANAGE_ALL_PROFILES]);

  useEffect(() => {
    loadExceptions();
  }, []);

  useEffect(() => {
    if (statusFilter === "ALL") {
      setFilteredExceptions(exceptions);
    } else {
      setFilteredExceptions(
        exceptions.filter((e) => e.status === statusFilter)
      );
    }
  }, [statusFilter, exceptions]);

  const loadExceptions = async () => {
    try {
      const data = await timeExceptionApi.getAll();
      setExceptions(data);
      setFilteredExceptions(data);

      // Pre-fill current user's name
      if (user && user.employeeId && !employeeNames[user.employeeId]) {
        setEmployeeNames(prev => ({
          ...prev,
          [user.employeeId!]: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "You"
        }));
      }

      // Fetch employee names for the list
      const uniqueEmployeeIds = Array.from(new Set(data.map(e => e.employeeId)));
      const missingIds = uniqueEmployeeIds.filter(id => !employeeNames[id]);

      if (missingIds.length > 0) {
        const newNames: Record<string, string> = { ...employeeNames };
        const isAdminForLookup = user && hasAnyPermission(user, [Permission.MANAGE_ALL_PROFILES]);

        await Promise.all(missingIds.map(async (id) => {
          // Only lookup if it's own profile OR if admin
          if (id === user?.employeeId || isAdminForLookup) {
            try {
              const emp = await employeeApi.getEmployeeById(id);
              newNames[id] = `${emp.firstName} ${emp.lastName}`;
            } catch (e) {
              newNames[id] = id; // Fallback to ID
            }
          }
        }));
        setEmployeeNames(newNames);
      }
    } catch (error) {
      console.error("Failed to load exceptions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records when employee is selected
  useEffect(() => {
    if (formData.employeeId) {
      loadAttendanceRecords(formData.employeeId);
    } else {
      setAttendanceRecords([]);
    }
  }, [formData.employeeId]);

  const loadAttendanceRecords = async (empId: string) => {
    setLoadingRecords(true);
    try {
      const now = new Date();
      const report = await attendanceApi.getMonthlyReport(
        now.getMonth() + 1,
        now.getFullYear(),
        empId
      );
      setAttendanceRecords(report.attendanceRecords || []);
    } catch (error) {
      console.error("Failed to load attendance records:", error);
      setAttendanceRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timeExceptionApi.create(formData);
      await loadExceptions();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to create exception:", error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await timeExceptionApi.approve(id);
      await loadExceptions();
    } catch (error) {
      console.error("Failed to approve exception:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await timeExceptionApi.reject(id);
      await loadExceptions();
    } catch (error) {
      console.error("Failed to reject exception:", error);
    }
  };

  const handleOpenDialog = () => {
    // Re-verify and set employee ID for non-admins when opening the dialog
    if (user && !isAdmin && user.employeeId) {
      setFormData(prev => ({
        ...prev,
        employeeId: user.employeeId!
      }));
    }
    setDialogOpen(true);
  };

  // Ensure employeeId is synced if user loads after dialog is open
  useEffect(() => {
    if (dialogOpen && user && !isAdmin && user.employeeId && !formData.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: user.employeeId! }));
    }
  }, [dialogOpen, user, isAdmin, formData.employeeId]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      employeeId: "",
      type: TimeExceptionType.MISSED_PUNCH,
      attendanceRecordId: "",
      assignedTo: "",
      reason: "",
    });
    setAttendanceRecords([]);
  };

  const getStatusBadge = (status: TimeExceptionStatus) => {
    switch (status) {
      case TimeExceptionStatus.OPEN:
        return <Badge variant="outline">Open</Badge>;
      case TimeExceptionStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case TimeExceptionStatus.APPROVED:
        return <Badge variant="success">Approved</Badge>;
      case TimeExceptionStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case TimeExceptionStatus.ESCALATED:
        return <Badge variant="secondary">Escalated</Badge>;
      case TimeExceptionStatus.RESOLVED:
        return <Badge variant="success">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: TimeExceptionType) => {
    switch (type) {
      case TimeExceptionType.MISSED_PUNCH:
        return <Badge variant="destructive">Missed Punch</Badge>;
      case TimeExceptionType.LATE:
        return <Badge variant="warning">Late</Badge>;
      case TimeExceptionType.EARLY_LEAVE:
        return <Badge variant="warning">Early Leave</Badge>;
      case TimeExceptionType.SHORT_TIME:
        return <Badge variant="secondary">Short Time</Badge>;
      case TimeExceptionType.OVERTIME_REQUEST:
        return <Badge variant="outline">Overtime Request</Badge>;
      case TimeExceptionType.MANUAL_ADJUSTMENT:
        return <Badge variant="outline">Manual Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Check permission for approval actions (backend requires APPROVE_LEAVES)
  const canApprove = user && hasAnyPermission(user, [Permission.APPROVE_LEAVES]);

  return (
    <AppShell title="Time Exceptions">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Exceptions</h1>
          <p className="text-muted-foreground">
            Manage attendance exceptions and approvals
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Exception
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Time Exception</DialogTitle>
                <DialogDescription>
                  Log a new time exception for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">Employee</Label>
                  {isAdmin ? (
                    <EmployeeSelector
                      onValueChange={(id: string) => setFormData({ ...formData, employeeId: id })}
                      value={formData.employeeId}
                    />
                  ) : (
                    <Input
                      value={employeeNames[user?.employeeId || ""] || (user?.firstName ? `${user.firstName} ${user.lastName}` : "You")}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {!isAdmin && user && !user.employeeId && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Error: Your account is not linked to an employee profile.
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Exception Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as TimeExceptionType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TimeExceptionType.MISSED_PUNCH}>Missed Punch</SelectItem>
                      <SelectItem value={TimeExceptionType.LATE}>Late</SelectItem>
                      <SelectItem value={TimeExceptionType.EARLY_LEAVE}>Early Leave</SelectItem>
                      <SelectItem value={TimeExceptionType.SHORT_TIME}>Short Time</SelectItem>
                      <SelectItem value={TimeExceptionType.OVERTIME_REQUEST}>Overtime Request</SelectItem>
                      <SelectItem value={TimeExceptionType.MANUAL_ADJUSTMENT}>Manual Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="attendanceRecordId">Attendance Record</Label>
                  <Select
                    value={formData.attendanceRecordId}
                    onValueChange={(value) => setFormData({ ...formData, attendanceRecordId: value })}
                    disabled={!formData.employeeId || loadingRecords}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.employeeId
                          ? "Please wait, identifying account..."
                          : loadingRecords
                            ? "Fetching your attendance logs..."
                            : attendanceRecords.length === 0
                              ? "No records found for this month"
                              : "Select the relevant record"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceRecords.map((record) => (
                        <SelectItem key={record._id} value={record._id}>
                          <div className="flex flex-col">
                            <span>{format(new Date(record.date), "EEE, MMM dd, yyyy")}</span>
                            <span className="text-xs text-muted-foreground">
                              {record.punches?.[0] ? format(new Date(record.punches[0].time), "HH:mm") : "No In"} - {record.punches?.[record.punches.length - 1]?.type === 'OUT' ? format(new Date(record.punches[record.punches.length - 1].time), "HH:mm") : "No Out"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assigned To (Manager)</Label>
                  <EmployeeSelector
                    onValueChange={(id: string) => setFormData({ ...formData, assignedTo: id })}
                    value={formData.assignedTo}
                    onlyManagers={true}
                    placeholder="Select manager..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Input
                    id="reason"
                    value={formData.reason || ""}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Explain the exception"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">Create Exception</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Exceptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="grid gap-2 w-64">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value={TimeExceptionStatus.OPEN}>Open</SelectItem>
                  <SelectItem value={TimeExceptionStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={TimeExceptionStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={TimeExceptionStatus.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={TimeExceptionStatus.ESCALATED}>Escalated</SelectItem>
                  <SelectItem value={TimeExceptionStatus.RESOLVED}>Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Exception Records
          </CardTitle>
          <CardDescription>
            All time exceptions requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading exceptions...</div>
          ) : filteredExceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exceptions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExceptions.map((exception) => (
                  <TableRow key={exception._id}>
                    <TableCell className="font-medium">
                      {employeeNames[exception.employeeId] || (
                        <span className="text-muted-foreground text-xs font-mono">
                          {exception.employeeId?.slice(-6) || "Unknown"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(exception.type)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {exception.reason || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(exception.status)}</TableCell>
                    <TableCell>
                      {exception.createdAt ? format(new Date(exception.createdAt), "MMM dd, yyyy HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(exception.status === TimeExceptionStatus.OPEN ||
                          exception.status === TimeExceptionStatus.PENDING) &&
                          canApprove && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(exception._id)}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(exception._id)}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

