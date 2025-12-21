"use client";

import { useState, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attendanceApi } from "@/lib/api/time-management";
import { MonthlyReportResponse } from "@/types/time-management";
import { FileText, Download, Calendar, Search, Printer } from "lucide-react";
import { format } from "date-fns";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const handleGenerateMonthlyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceApi.getMonthlyReport(
        formData.month,
        formData.year,
        formData.employeeId
      );
      setMonthlyReport(data);
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message;
      
      if (status === 403) {
        setError("You don't have permission to view attendance reports. This feature requires manager or admin access.");
      } else if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(message || "Failed to generate report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getMonthName = (month: number) => {
    return format(new Date(2024, month - 1, 1), "MMMM");
  };

  const exportToPDF = () => {
    if (!monthlyReport) return;

    // Create a printable version of the report
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Attendance Report - ${monthlyReport.employeeId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #333; }
            .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background: #fafafa; }
            .status-complete { color: green; }
            .status-pending { color: orange; }
            .status-missed { color: red; }
            .punch-in { background: #e8f5e9; padding: 2px 6px; border-radius: 3px; margin-right: 5px; }
            .punch-out { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; margin-right: 5px; }
            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Monthly Attendance Report</h1>
          <p><strong>Employee ID:</strong> ${monthlyReport.employeeId}</p>
          <p><strong>Period:</strong> ${getMonthName(monthlyReport.month)} ${monthlyReport.year}</p>
          <p><strong>Generated:</strong> ${format(new Date(), "MMMM dd, yyyy HH:mm")}</p>
          
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-value">${monthlyReport.summary.totalWorkingDays}</div>
              <div class="summary-label">Working Days</div>
            </div>
            <div class="summary-card">
              <div class="summary-value" style="color: green;">${monthlyReport.summary.daysPresent}</div>
              <div class="summary-label">Days Present</div>
            </div>
            <div class="summary-card">
              <div class="summary-value" style="color: red;">${monthlyReport.summary.daysAbsent}</div>
              <div class="summary-label">Days Absent</div>
            </div>
            <div class="summary-card">
              <div class="summary-value" style="color: orange;">${monthlyReport.summary.totalLateCount}</div>
              <div class="summary-label">Late Count</div>
            </div>
          </div>
          
          <div class="summary-grid" style="grid-template-columns: repeat(2, 1fr);">
            <div class="summary-card">
              <div class="summary-value">${formatMinutes(monthlyReport.summary.totalWorkMinutes)}</div>
              <div class="summary-label">Total Work Time</div>
            </div>
            <div class="summary-card">
              <div class="summary-value" style="color: #2196f3;">${formatMinutes(monthlyReport.summary.totalOvertimeMinutes)}</div>
              <div class="summary-label">Total Overtime</div>
            </div>
          </div>

          <h2>Daily Records</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Punches</th>
                <th>Work Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyReport.attendanceRecords.map((record) => `
                <tr>
                  <td>${record.createdAt ? format(new Date(record.createdAt), "MMM dd, yyyy") : "-"}</td>
                  <td>
                    ${record.punches.map((punch) => `
                      <span class="${punch.type === "IN" ? "punch-in" : "punch-out"}">${punch.type}</span>
                      ${format(new Date(punch.time), "HH:mm")}
                    `).join(" ")}
                  </td>
                  <td>${formatMinutes(record.totalWorkMinutes)}</td>
                  <td class="${record.hasMissedPunch ? "status-missed" : record.finalisedForPayroll ? "status-complete" : "status-pending"}">
                    ${record.hasMissedPunch ? "Missed Punch" : record.finalisedForPayroll ? "Complete" : "Pending"}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Time Management System - Attendance Report</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const exportToCSV = () => {
    if (!monthlyReport || monthlyReport.attendanceRecords.length === 0) return;

    const headers = ["Date", "Punches", "Work Time (minutes)", "Status"];
    
    const rows = monthlyReport.attendanceRecords.map((record) => {
      const date = record.createdAt ? format(new Date(record.createdAt), "yyyy-MM-dd") : "-";
      const punches = record.punches
        .map((p) => `${p.type}: ${format(new Date(p.time), "HH:mm")}`)
        .join("; ");
      const workTime = record.totalWorkMinutes.toString();
      const status = record.hasMissedPunch 
        ? "Missed Punch" 
        : record.finalisedForPayroll 
          ? "Complete" 
          : "Pending";

      return [date, punches, workTime, status];
    });

    // Add summary row
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Working Days", monthlyReport.summary.totalWorkingDays.toString()]);
    rows.push(["Days Present", monthlyReport.summary.daysPresent.toString()]);
    rows.push(["Days Absent", monthlyReport.summary.daysAbsent.toString()]);
    rows.push(["Late Count", monthlyReport.summary.totalLateCount.toString()]);
    rows.push(["Total Work Minutes", monthlyReport.summary.totalWorkMinutes.toString()]);
    rows.push(["Total Overtime Minutes", monthlyReport.summary.totalOvertimeMinutes.toString()]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `monthly-report-${monthlyReport.employeeId}-${monthlyReport.year}-${monthlyReport.month}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell 
      title="Attendance Reports"
      allowedRoles={["HR Manager", "HR Admin", "System Admin", "Payroll Specialist", "Payroll Manager"]}
    >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground">
            Generate and export attendance reports for employees
          </p>
        </div>

        {/* Report Generation Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Report
            </CardTitle>
            <CardDescription>
              Select parameters to generate an attendance report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Enter employee ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleGenerateMonthlyReport} disabled={loading || !formData.employeeId}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {monthlyReport && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Working Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monthlyReport.summary.totalWorkingDays}
                  </div>
                  <p className="text-xs text-muted-foreground">Expected days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Days Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {monthlyReport.summary.daysPresent}
                  </div>
                  <p className="text-xs text-muted-foreground">Attended</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Days Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {monthlyReport.summary.daysAbsent}
                  </div>
                  <p className="text-xs text-muted-foreground">Not attended</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Late Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {monthlyReport.summary.totalLateCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Times late</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Work Summary</CardTitle>
                <CardDescription>
                  Total hours and overtime for {getMonthName(monthlyReport.month)} {monthlyReport.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Work Time</div>
                    <div className="text-2xl font-bold">
                      {formatMinutes(monthlyReport.summary.totalWorkMinutes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Overtime</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatMinutes(monthlyReport.summary.totalOvertimeMinutes)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Records */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Monthly Attendance Details
                    </CardTitle>
                    <CardDescription>
                      Employee: {monthlyReport.employeeId}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportToCSV}
                      disabled={monthlyReport.attendanceRecords.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportToPDF}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print / PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyReport.attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found for this period
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Punches</TableHead>
                        <TableHead>Work Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyReport.attendanceRecords.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.createdAt && format(new Date(record.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {record.punches.map((punch, idx) => (
                                <div key={idx} className="text-sm">
                                  <Badge
                                    variant={punch.type === "IN" ? "success" : "secondary"}
                                    className="mr-2 text-xs"
                                  >
                                    {punch.type}
                                  </Badge>
                                  {format(new Date(punch.time), "HH:mm")}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!monthlyReport && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Report Generated</p>
                <p className="text-sm">Enter an employee ID and click "Generate Report" to view attendance data</p>
              </div>
            </CardContent>
          </Card>
        )}
    </AppShell>
  );
}
