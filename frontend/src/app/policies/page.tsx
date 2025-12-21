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
import { overtimeRuleApi, latenessRuleApi } from "@/lib/api/time-management";
import { OvertimeRule, LatenessRule } from "@/types/time-management";
import { Plus, Edit, Trash2, Settings, Clock, AlertTriangle } from "lucide-react";

export default function PoliciesPage() {
  const [overtimeRules, setOvertimeRules] = useState<OvertimeRule[]>([]);
  const [latenessRules, setLatenessRules] = useState<LatenessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [latenessDialogOpen, setLatenessDialogOpen] = useState(false);
  const [editingOvertimeRule, setEditingOvertimeRule] = useState<OvertimeRule | null>(null);
  const [editingLatenessRule, setEditingLatenessRule] = useState<LatenessRule | null>(null);

  const [overtimeFormData, setOvertimeFormData] = useState({
    name: "",
    description: "",
    active: true,
    approved: false,
  });

  const [latenessFormData, setLatenessFormData] = useState({
    name: "",
    description: "",
    gracePeriodMinutes: 0,
    deductionForEachMinute: 0,
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overtime, lateness] = await Promise.all([
        overtimeRuleApi.getAll(),
        latenessRuleApi.getAll(),
      ]);
      setOvertimeRules(overtime);
      setLatenessRules(lateness);
    } catch (error) {
      console.error("Failed to load policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOvertimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOvertimeRule) {
        await overtimeRuleApi.update(editingOvertimeRule._id, overtimeFormData);
      } else {
        await overtimeRuleApi.create(overtimeFormData);
      }
      await loadData();
      handleCloseOvertimeDialog();
    } catch (error) {
      console.error("Failed to save overtime rule:", error);
    }
  };

  const handleLatenessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLatenessRule) {
        await latenessRuleApi.update(editingLatenessRule._id, latenessFormData);
      } else {
        await latenessRuleApi.create(latenessFormData);
      }
      await loadData();
      handleCloseLatenessDialog();
    } catch (error) {
      console.error("Failed to save lateness rule:", error);
    }
  };

  const handleDeleteOvertimeRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this overtime rule?")) return;
    try {
      await overtimeRuleApi.delete(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete overtime rule:", error);
    }
  };

  const handleDeleteLatenessRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lateness rule?")) return;
    try {
      await latenessRuleApi.delete(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete lateness rule:", error);
    }
  };

  const handleEditOvertimeRule = (rule: OvertimeRule) => {
    setEditingOvertimeRule(rule);
    setOvertimeFormData({
      name: rule.name,
      description: rule.description || "",
      active: rule.active,
      approved: rule.approved,
    });
    setOvertimeDialogOpen(true);
  };

  const handleEditLatenessRule = (rule: LatenessRule) => {
    setEditingLatenessRule(rule);
    setLatenessFormData({
      name: rule.name,
      description: rule.description || "",
      gracePeriodMinutes: rule.gracePeriodMinutes,
      deductionForEachMinute: rule.deductionForEachMinute,
      active: rule.active,
    });
    setLatenessDialogOpen(true);
  };

  const handleCloseOvertimeDialog = () => {
    setOvertimeDialogOpen(false);
    setEditingOvertimeRule(null);
    setOvertimeFormData({
      name: "",
      description: "",
      active: true,
      approved: false,
    });
  };

  const handleCloseLatenessDialog = () => {
    setLatenessDialogOpen(false);
    setEditingLatenessRule(null);
    setLatenessFormData({
      name: "",
      description: "",
      gracePeriodMinutes: 0,
      deductionForEachMinute: 0,
      active: true,
    });
  };

  return (
    <AppShell 
      title="Time Management Policies"
      allowedRoles={["HR Manager", "HR Admin", "System Admin"]}
    >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Time Management Policies</h1>
          <p className="text-muted-foreground">
            Configure overtime and lateness rules for your organization
          </p>
        </div>

        {/* Overtime Rules Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Overtime Rules
                </CardTitle>
                <CardDescription>
                  Define how overtime is calculated and approved
                </CardDescription>
              </div>
              <Button onClick={() => {
                setEditingOvertimeRule(null);
                setOvertimeDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
              <Dialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleOvertimeSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingOvertimeRule ? "Edit Overtime Rule" : "Create Overtime Rule"}
                      </DialogTitle>
                      <DialogDescription>
                        Configure overtime calculation parameters
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="overtime-name">Rule Name</Label>
                        <Input
                          id="overtime-name"
                          value={overtimeFormData.name}
                          onChange={(e) => setOvertimeFormData({ ...overtimeFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="overtime-description">Description (Optional)</Label>
                        <Input
                          id="overtime-description"
                          value={overtimeFormData.description}
                          onChange={(e) => setOvertimeFormData({ ...overtimeFormData, description: e.target.value })}
                          placeholder="Describe when this rule applies"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="overtimeActive"
                          checked={overtimeFormData.active}
                          onChange={(e) => setOvertimeFormData({ ...overtimeFormData, active: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="overtimeActive">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="approved"
                          checked={overtimeFormData.approved}
                          onChange={(e) => setOvertimeFormData({ ...overtimeFormData, approved: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="approved">Pre-approved (no approval needed)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseOvertimeDialog}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingOvertimeRule ? "Update" : "Create"} Rule
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : overtimeRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No overtime rules defined
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Pre-approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeRules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {rule.description || "-"}
                      </TableCell>
                      <TableCell>
                        {rule.approved ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <Badge variant="warning">Needs Approval</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {rule.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditOvertimeRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOvertimeRule(rule._id)}
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

        {/* Lateness Rules Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Lateness Rules
                </CardTitle>
                <CardDescription>
                  Configure grace periods and penalties for late arrivals
                </CardDescription>
              </div>
              <Button onClick={() => {
                setEditingLatenessRule(null);
                setLatenessDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
              <Dialog open={latenessDialogOpen} onOpenChange={setLatenessDialogOpen}>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleLatenessSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingLatenessRule ? "Edit Lateness Rule" : "Create Lateness Rule"}
                      </DialogTitle>
                      <DialogDescription>
                        Define grace periods and deduction rules
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lateness-name">Rule Name</Label>
                        <Input
                          id="lateness-name"
                          value={latenessFormData.name}
                          onChange={(e) => setLatenessFormData({ ...latenessFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lateness-description">Description (Optional)</Label>
                        <Input
                          id="lateness-description"
                          value={latenessFormData.description}
                          onChange={(e) => setLatenessFormData({ ...latenessFormData, description: e.target.value })}
                          placeholder="Describe when this rule applies"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="gracePeriod">Grace Period (minutes)</Label>
                        <Input
                          id="gracePeriod"
                          type="number"
                          min="0"
                          value={latenessFormData.gracePeriodMinutes}
                          onChange={(e) => setLatenessFormData({ ...latenessFormData, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deduction">Deduction per Minute</Label>
                        <Input
                          id="deduction"
                          type="number"
                          min="0"
                          step="0.01"
                          value={latenessFormData.deductionForEachMinute}
                          onChange={(e) => setLatenessFormData({ ...latenessFormData, deductionForEachMinute: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Amount deducted for each minute late after grace period
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="latenessActive"
                          checked={latenessFormData.active}
                          onChange={(e) => setLatenessFormData({ ...latenessFormData, active: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="latenessActive">Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseLatenessDialog}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingLatenessRule ? "Update" : "Create"} Rule
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : latenessRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No lateness rules defined
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Grace Period</TableHead>
                    <TableHead>Deduction/Min</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latenessRules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {rule.description || "-"}
                      </TableCell>
                      <TableCell>{rule.gracePeriodMinutes} min</TableCell>
                      <TableCell>{rule.deductionForEachMinute}</TableCell>
                      <TableCell>
                        {rule.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditLatenessRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLatenessRule(rule._id)}
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
