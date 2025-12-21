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
import { scheduleRuleApi } from "@/lib/api/time-management";
import { ScheduleRule } from "@/types/time-management";
import { Plus, Edit, Trash2, CalendarClock } from "lucide-react";
import { format } from "date-fns";

export default function ScheduleRulesPage() {
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    pattern: "",
    active: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await scheduleRuleApi.getAll();
      setRules(data);
    } catch (error) {
      console.error("Failed to load schedule rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await scheduleRuleApi.update(editingRule._id, formData);
      } else {
        await scheduleRuleApi.create(formData);
      }
      await loadRules();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save schedule rule:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule rule?")) return;
    try {
      await scheduleRuleApi.delete(id);
      await loadRules();
    } catch (error) {
      console.error("Failed to delete schedule rule:", error);
    }
  };

  const handleEdit = (rule: ScheduleRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      pattern: rule.pattern,
      active: rule.active,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormData({
      name: "",
      pattern: "",
      active: true,
    });
  };

  const toggleActive = async (rule: ScheduleRule) => {
    try {
      await scheduleRuleApi.update(rule._id, { active: !rule.active });
      await loadRules();
    } catch (error) {
      console.error("Failed to toggle rule status:", error);
    }
  };

  return (
    <AppShell 
      title="Schedule Rules"
      allowedRoles={["HR Manager", "HR Admin", "System Admin"]}
    >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule Rules</h1>
            <p className="text-muted-foreground">
              Define scheduling patterns and rules for your organization
            </p>
          </div>
          <Button onClick={() => {
            setEditingRule(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "Edit Schedule Rule" : "Create Schedule Rule"}
                  </DialogTitle>
                  <DialogDescription>
                    Define a scheduling pattern for employee shifts
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Standard Work Week"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pattern">Pattern</Label>
                    <Input
                      id="pattern"
                      value={formData.pattern}
                      onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                      placeholder="e.g., Mon-Fri 9:00-17:00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Define the scheduling pattern (e.g., "Mon-Fri 9:00-17:00", "Weekdays", "Rotating")
                    </p>
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
                    {editingRule ? "Update" : "Create"} Rule
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Schedule Rules
            </CardTitle>
            <CardDescription>
              All configured scheduling rules in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading schedule rules...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No schedule rules defined yet. Click "Add Rule" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {rule.pattern}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div onClick={() => toggleActive(rule)} className="inline-block cursor-pointer">
                          <Badge
                            variant={rule.active ? "success" : "secondary"}
                          >
                            {rule.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.createdAt && format(new Date(rule.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rule._id)}
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

