"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { employeeApi, EmployeeProfile } from "@/lib/api/employee-api";
import { getCurrentUser } from "@/lib/auth";

interface EmployeeSelectorProps {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    onlyManagers?: boolean; // Filter to show only managers (department heads)
}

export function EmployeeSelector({
    value,
    onValueChange,
    placeholder = "Select employee...",
    onlyManagers = false,
}: EmployeeSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [employees, setEmployees] = React.useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const user = getCurrentUser();
        const hasSearchPermission = user && (
            user.role === "System Admin" ||
            user.permissions?.includes("MANAGE_ALL_PROFILES")
        );

        if (hasSearchPermission) {
            loadEmployees();
        } else {
            setError("Insufficient permissions to search employees.");
        }
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await employeeApi.searchEmployees("");
            setEmployees(data);
        } catch (error: any) {
            console.error("Failed to load employees:", error);
            if (error.response?.status === 403) {
                setError("Insufficient permissions to search employees.");
            } else {
                setError("Failed to load employee list.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter employees based on role if onlyManagers is true
    const filteredEmployees = React.useMemo(() => {
        if (!onlyManagers) {
            return employees;
        }
        
        return employees.filter((emp: any) => {
            // Check if employee has department head role
            const roles = emp.systemRoles || emp.roles || [];
            return roles.some((role: string) => 
                role.toLowerCase().includes('department') && 
                role.toLowerCase().includes('head')
            );
        });
    }, [employees, onlyManagers]);

    const selectedEmployee = filteredEmployees.find((emp) => emp._id === value);

    // For managers, use a simple text input instead of dropdown
    if (onlyManagers) {
        return (
            <div className="flex flex-col gap-2">
                <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter Manager ID..."
                    value={value || ""}
                    onChange={(e) => onValueChange(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic leading-tight">
                    Please enter the Manager's ID manually.
                </p>
            </div>
        );
    }

    if (error && error.includes("permissions")) {
        return (
            <div className="flex flex-col gap-2">
                <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter ID manually..."
                    value={value || ""}
                    onChange={(e) => onValueChange(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic leading-tight">
                    Search is restricted for privacy. Please enter the Manager's ID manually.
                </p>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedEmployee
                        ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder={onlyManagers ? "Search managers..." : "Search employees..."}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2 text-sm">Loading employees...</span>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>
                                    {onlyManagers ? "No manager found." : "No employee found."}
                                </CommandEmpty>
                                <CommandGroup>
                                    {filteredEmployees.map((employee) => {
                                            const handleSelect = () => {
                                                onValueChange(employee._id);
                                                setOpen(false);
                                                setSearchQuery(""); // Clear search after selection
                                            };
                                            
                                            return (
                                        <CommandItem
                                            key={employee._id}
                                            value={`${employee.firstName} ${employee.lastName} ${employee.email || employee.workEmail || employee.employeeNumber || ""}`}
                                            onSelect={handleSelect}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === employee._id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{employee.firstName} {employee.lastName}</span>
                                                {(employee.email || employee.workEmail) && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {employee.email || employee.workEmail}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                            );
                                        })}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
