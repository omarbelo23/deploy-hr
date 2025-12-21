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
import { shiftDefinitionApi, shiftTypeApi } from "@/lib/api/time-management";
import { ShiftDefinition, ShiftTypeModel } from "@/types/time-management";
import { Plus, Edit, Trash2, Clock } from "lucide-react";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    shiftType: "",
    startTime: "",
    endTime: "",
    graceInMinutes: 15,
    graceOutMinutes: 15,
    punchPolicy: "FIRST_LAST",
    requiresApprovalForOvertime: true,
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shiftsData, typesData] = await Promise.all([
        shiftDefinitionApi.getAll(),
        shiftTypeApi.getAll(),
      ]);
      setShifts(shiftsData);
      setShiftTypes(typesData);

      console.log('Loaded shift types:', typesData);

      // Set default shift type if available and not already set
      if (typesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          shiftType: prev.shiftType || typesData[0]._id
        }));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting shift data:', formData);
    try {
      if (editingShift) {
        await shiftDefinitionApi.update(editingShift._id, formData);
      } else {
        await shiftDefinitionApi.create(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Failed to save shift:", error);
      console.error("Error response:", error.response?.data);
      alert(`Failed to create shift: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      await shiftDefinitionApi.delete(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete shift:", error);
    }
  };

  const handleEdit = (shift: ShiftDefinition) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      shiftType: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceInMinutes: shift.graceInMinutes || 15,
      graceOutMinutes: shift.graceOutMinutes || 15,
      punchPolicy: shift.punchPolicy || "FIRST_LAST",
      requiresApprovalForOvertime: shift.requiresApprovalForOvertime ?? true,
      active: shift.active,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingShift(null);
    setFormData({
      name: "",
      shiftType: shiftTypes.length > 0 ? shiftTypes[0]._id : "",
      startTime: "",
      endTime: "",
      graceInMinutes: 15,
      graceOutMinutes: 15,
      punchPolicy: "FIRST_LAST",
      requiresApprovalForOvertime: true,
      active: true,
    });
  };

  return (
    <AppShell 
      title="Shift Management"
      allowedRoles={["HR Manager", "HR Admin", "System Admin"]}
    >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground">
              Define and manage shift templates for your organization
            </p>
          </div>
          <Button onClick={() => {
            setEditingShift(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingShift ? "Edit Shift" : "Create New Shift"}</DialogTitle>
                  <DialogDescription>
                    Define shift details including timing and grace periods
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Shift Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shiftType">Shift Type</Label>
                    <Select
                      value={formData.shiftType}
                      onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftTypes.map((type) => (
                          <SelectItem key={type._id} value={type._id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="graceInMinutes">Grace In (minutes)</Label>
                      <Input
                        id="graceInMinutes"
                        type="number"
                        min="0"
                        value={formData.graceInMinutes}
                        onChange={(e) => setFormData({ ...formData, graceInMinutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="graceOutMinutes">Grace Out (minutes)</Label>
                      <Input
                        id="graceOutMinutes"
                        type="number"
                        min="0"
                        value={formData.graceOutMinutes}
                        onChange={(e) => setFormData({ ...formData, graceOutMinutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresApprovalForOvertime"
                      checked={formData.requiresApprovalForOvertime}
                      onChange={(e) => setFormData({ ...formData, requiresApprovalForOvertime: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="requiresApprovalForOvertime">Requires Approval for Overtime</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingShift ? "Update" : "Create"} Shift
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Shift Definitions
            </CardTitle>
            <CardDescription>
              All configured shift templates in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading shifts...</div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No shifts defined yet. Click "Add Shift" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Grace Period</TableHead>
                    <TableHead>Flexible</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => {
                    const shiftTypeName = shiftTypes.find(t => t._id === shift.shiftType)?.name || 'Unknown';
                    return (
                      <TableRow key={shift._id}>
                        <TableCell className="font-medium">{shift.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{shiftTypeName}</Badge>
                        </TableCell>
                        <TableCell>
                          {shift.startTime} - {shift.endTime}
                        </TableCell>
                        <TableCell>{shift.graceInMinutes || 0} / {shift.graceOutMinutes || 0} min</TableCell>
                        <TableCell>
                          {shift.requiresApprovalForOvertime ? (
                            <Badge variant="secondary">Requires Approval</Badge>
                          ) : (
                            <Badge variant="success">Auto-approved</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {shift.active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(shift)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                          onClick={() => handleDelete(shift._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </AppShell>
  );
}
