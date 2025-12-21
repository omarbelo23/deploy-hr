"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { attendanceApi } from "@/lib/api/time-management";
import { DailyReportResponse } from "@/types/time-management";
import { Calendar, Search, Download } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceRecordsPage() {
  const [report, setReport] = useState<DailyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await attendanceApi.getDailyReport(selectedDate);
      
      // Handle case where backend returns array directly or object with attendanceRecords
      const records = Array.isArray(data) ? data : (data.attendanceRecords || []);
      
      // Compute summary from attendance records if not provided by backend
      const summary = (data && !Array.isArray(data) && data.summary) ? data.summary : {
        totalPresent: records.filter(r => r.punches && r.punches.length > 0).length || 0,
        totalAbsent: 0, // Would need total employees to calculate properly
        totalLate: 0, // Would need shift start times to calculate properly
        totalMissedPunch: records.filter(r => r.hasMissedPunch).length || 0,
      };
      
      setReport({
        date: selectedDate,
        attendanceRecords: records,
        summary,
      });
    } catch (error) {
      console.error("Failed to load attendance records:", error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const exportToCSV = () => {
    if (!report || report.attendanceRecords.length === 0) return;

    const headers = ["Employee ID", "Employee Name", "Email", "Punches", "Total Work Time", "Status", "Exceptions"];
    
    const rows = report.attendanceRecords.map((record) => {
      const employeeName = record.employee 
        ? `${record.employee.firstName} ${record.employee.lastName}`
        : record.employeeId;
      const email = record.employee?.email || "-";
      const punches = record.punches
        .map((p) => `${p.type}: ${format(new Date(p.time), "HH:mm:ss")}`)
        .join("; ");
      const workTime = formatMinutes(record.totalWorkMinutes);
      const status = record.hasMissedPunch 
        ? "Missed Punch" 
        : record.finalisedForPayroll 
          ? "Complete" 
          : "Pending";
      const exceptions = record.exceptionIds.length > 0 
        ? `${record.exceptionIds.length} Exception(s)` 
        : "-";

      return [record.employeeId, employeeName, email, punches, workTime, status, exceptions];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-report-${selectedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell 
      title="Attendance Records"
      allowedRoles={["HR Manager", "HR Admin", "System Admin", "Payroll Specialist", "Payroll Manager"]}
    >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="text-muted-foreground">
            View and manage employee attendance records
          </p>
        </div>

        {/* Date Selection Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <Button onClick={loadReport}>
                <Search className="mr-2 h-4 w-4" />
                Load Records
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {report && report.summary && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalPresent ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalAbsent ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalLate ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Missed Punches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalMissedPunch ?? 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Attendance Report</CardTitle>
                <CardDescription>
                  {selectedDate && format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                disabled={!report || report.attendanceRecords.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading records...</div>
            ) : !report || report.attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for this date
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Punches</TableHead>
                    <TableHead>Total Work Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Exceptions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.attendanceRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">
                        {record.employee ? (
                          <div>
                            <div>{record.employee.firstName} {record.employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.employee.email}
                            </div>
                          </div>
                        ) : (
                          record.employeeId
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {record.punches.map((punch, idx) => (
                            <div key={idx} className="text-sm">
                              <Badge variant={punch.type === "IN" ? "success" : "secondary"} className="mr-2">
                                {punch.type}
                              </Badge>
                              {format(new Date(punch.time), "HH:mm:ss")}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatMinutes(record.totalWorkMinutes)}</TableCell>
                      <TableCell>
                        {record.hasMissedPunch ? (
                          <Badge variant="destructive">Missed Punch</Badge>
                        ) : record.finalisedForPayroll ? (
                          <Badge variant="success">Complete</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.exceptionIds.length > 0 && (
                          <Badge variant="outline">{record.exceptionIds.length} Exception(s)</Badge>
                        )}
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
