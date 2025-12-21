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
import { shiftTypeApi } from "@/lib/api/time-management";
import { ShiftTypeModel } from "@/types/time-management";
import { Plus, Edit, Trash2, Layers } from "lucide-react";

export default function ShiftTypesPage() {
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ShiftTypeModel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    active: true,
  });

  useEffect(() => {
    loadShiftTypes();
  }, []);

  const loadShiftTypes = async () => {
    try {
      const data = await shiftTypeApi.getAll();
      setShiftTypes(data);
    } catch (error) {
      console.error("Failed to load shift types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await shiftTypeApi.update(editingType._id, formData);
      } else {
        await shiftTypeApi.create(formData);
      }
      await loadShiftTypes();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save shift type:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift type? This may affect existing shifts using this type.")) return;
    try {
      await shiftTypeApi.delete(id);
      await loadShiftTypes();
    } catch (error) {
      console.error("Failed to delete shift type:", error);
    }
  };

  const handleEdit = (type: ShiftTypeModel) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      active: type.active,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingType(null);
    setFormData({
      name: "",
      active: true,
    });
  };

  const toggleActive = async (type: ShiftTypeModel) => {
    try {
      await shiftTypeApi.update(type._id, { active: !type.active });
      await loadShiftTypes();
    } catch (error) {
      console.error("Failed to toggle shift type status:", error);
    }
  };

  return (
    <AppShell 
      title="Shift Types"
      allowedRoles={["HR Manager", "HR Admin", "System Admin"]}
    >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shift Types</h1>
            <p className="text-muted-foreground">
              Manage shift type categories for your organization
            </p>
          </div>
          <Button onClick={() => {
            setEditingType(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift Type
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? "Edit Shift Type" : "Create Shift Type"}
                  </DialogTitle>
                  <DialogDescription>
                    Define a category for grouping shifts
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Type Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Day Shift, Night Shift, Rotating"
                      required
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
                    {editingType ? "Update" : "Create"} Shift Type
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Shift Type Categories
            </CardTitle>
            <CardDescription>
              All configured shift types used for categorizing shifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading shift types...</div>
            ) : shiftTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No shift types defined yet. Click "Add Shift Type" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftTypes.map((type) => (
                    <TableRow key={type._id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <div onClick={() => toggleActive(type)} className="inline-block cursor-pointer">
                          <Badge
                            variant={type.active ? "success" : "secondary"}
                          >
                            {type.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(type._id)}
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

        {/* Usage Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About Shift Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Shift types are used to categorize different kinds of shifts in your organization</p>
            <p>• Common examples include: Day Shift, Night Shift, Rotating Shift, Split Shift</p>
            <p>• Each shift definition must be associated with a shift type</p>
            <p>• Deactivating a shift type will prevent it from being used in new shift definitions</p>
          </CardContent>
        </Card>
    </AppShell>
  );
}

