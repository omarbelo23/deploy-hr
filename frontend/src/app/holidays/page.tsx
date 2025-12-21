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
import { holidayApi } from "@/lib/api/time-management";
import { Holiday, HolidayType } from "@/types/time-management";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    type: HolidayType.NATIONAL,
    name: "",
    startDate: "",
    endDate: "",
    active: true,
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const data = await holidayApi.getAll();
      setHolidays(data);
    } catch (error) {
      console.error("Failed to load holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        type: formData.type,
        name: formData.name || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        active: formData.active,
      };
      if (editingHoliday) {
        await holidayApi.update(editingHoliday._id, submitData);
      } else {
        await holidayApi.create(submitData);
      }
      await loadHolidays();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save holiday:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await holidayApi.delete(id);
      await loadHolidays();
    } catch (error) {
      console.error("Failed to delete holiday:", error);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      type: holiday.type,
      name: holiday.name || "",
      startDate: holiday.startDate.split("T")[0],
      endDate: holiday.endDate ? holiday.endDate.split("T")[0] : "",
      active: holiday.active,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHoliday(null);
    setFormData({
      type: HolidayType.NATIONAL,
      name: "",
      startDate: "",
      endDate: "",
      active: true,
    });
  };

  return (
    <AppShell 
      title="Holiday Calendar"
      allowedRoles={["HR Manager", "HR Admin", "System Admin"]}
    >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Holiday Calendar</h1>
            <p className="text-muted-foreground">
              Manage company holidays and non-working days
            </p>
          </div>
          <Button onClick={() => {
            setEditingHoliday(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                  </DialogTitle>
                  <DialogDescription>
                    Define a company holiday or non-working day
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Holiday Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as HolidayType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={HolidayType.NATIONAL}>National</SelectItem>
                        <SelectItem value={HolidayType.ORGANIZATIONAL}>Organizational</SelectItem>
                        <SelectItem value={HolidayType.WEEKLY_REST}>Weekly Rest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Holiday Name (Optional)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., New Year's Day"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingHoliday ? "Update" : "Add"} Holiday
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Company Holidays
            </CardTitle>
            <CardDescription>
              All defined holidays and non-working days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading holidays...</div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No holidays defined yet. Click "Add Holiday" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday._id}>
                      <TableCell className="font-medium">{holiday.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{holiday.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(holiday.startDate), "MMMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {holiday.endDate 
                          ? format(new Date(holiday.endDate), "MMMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {holiday.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(holiday)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(holiday._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
