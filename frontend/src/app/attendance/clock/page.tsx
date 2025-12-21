"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { attendanceApi } from "@/lib/api/time-management";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { AuthPayload } from "@/types/auth";

export default function ClockInOutPage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<"clocked-out" | "clocked-in">("clocked-out");
  const [lastAction, setLastAction] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (user?.employeeId) {
      loadTodayAttendance();
    }
  }, [user]);

  const loadTodayAttendance = async () => {
    if (!user?.employeeId) return;

    try {
      const record = await attendanceApi.getTodayAttendance(user.employeeId);
      if (record && record.punches.length > 0) {
        const lastPunch = record.punches[record.punches.length - 1];
        setLastAction(new Date(lastPunch.time));
        setStatus(lastPunch.type === "IN" ? "clocked-in" : "clocked-out");
      }
    } catch (err: any) {
      // Handle network errors
      if (!err?.response) {
        console.warn("Network error: Backend server may be unavailable");
        // Don't show error, just start with clocked-out state
        setStatus("clocked-out");
        return;
      }
      // Handle 403 gracefully - user might not have CLOCK_IN_OUT permission yet
      if (err?.response?.status === 403) {
        console.warn("Permission denied: CLOCK_IN_OUT permission required");
        // Don't show error, just start with clocked-out state
        setStatus("clocked-out");
      } else {
        console.error("Failed to load today's attendance:", err);
      }
    }
  };

  const handleClockIn = async () => {
    if (!user?.employeeId) {
      setError("Employee ID not found");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await attendanceApi.clockIn({
        employeeId: user.employeeId,
      });
      setStatus("clocked-in");
      setLastAction(new Date());
      setSuccess("Successfully clocked in!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user?.employeeId) {
      setError("Employee ID not found");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await attendanceApi.clockOut({
        employeeId: user.employeeId,
      });
      setStatus("clocked-out");
      setLastAction(new Date());
      setSuccess("Successfully clocked out!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Clock In / Clock Out" subtitle="Record your attendance for today">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Time Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Time
              </CardTitle>
              <CardDescription>
                {format(currentTime, "EEEE, MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold tabular-nums">
                {format(currentTime, "HH:mm:ss")}
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attendance Status
              </CardTitle>
              <CardDescription>Your current status for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge
                  variant={status === "clocked-in" ? "success" : "secondary"}
                  className="text-base px-4 py-2"
                >
                  {status === "clocked-in" ? "Clocked In" : "Clocked Out"}
                </Badge>
              </div>
              {lastAction && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Last action: {format(lastAction, "HH:mm:ss")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clock In/Out Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Record Attendance</CardTitle>
            <CardDescription>
              Click the appropriate button to record your attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={handleClockIn}
                disabled={loading || status === "clocked-in"}
                className="flex-1"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Clock In
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleClockOut}
                disabled={loading || status === "clocked-out"}
                className="flex-1"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Clock Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Please clock in when you start your work day</p>
            <p>• Clock out when you finish for the day</p>
            <p>• If you forget to clock in/out, you can request a correction from your manager</p>
            <p>• Multiple punches per day may be allowed based on your shift configuration</p>
          </CardContent>
        </Card>
    </AppShell>
  );
}
