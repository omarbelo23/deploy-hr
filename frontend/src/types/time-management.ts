// Enums matching backend
export enum PunchType {
  IN = "IN",
  OUT = "OUT",
}

// CorrectionRequestStatus matching backend enum
export enum CorrectionStatus {
  SUBMITTED = "SUBMITTED",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
}

// ShiftType is now a model, not an enum
export interface ShiftTypeModel {
  _id: string;
  name: string;
  active: boolean;
}

export interface CreateShiftTypeDto {
  name: string;
  active?: boolean;
}

export interface UpdateShiftTypeDto extends Partial<CreateShiftTypeDto> { }

// Note: Backend OvertimeRule doesn't have a type enum
// Keeping this for potential future use but updating the interface

export enum TimeExceptionType {
  MISSED_PUNCH = "MISSED_PUNCH",
  LATE = "LATE",
  EARLY_LEAVE = "EARLY_LEAVE",
  SHORT_TIME = "SHORT_TIME",
  OVERTIME_REQUEST = "OVERTIME_REQUEST",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

export enum TimeExceptionStatus {
  OPEN = "OPEN",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
  RESOLVED = "RESOLVED",
}

// DTOs matching backend
export interface ClockInDto {
  employeeId: string;
  timestamp?: string;
}

export interface ClockOutDto {
  employeeId: string;
  timestamp?: string;
}

export interface CorrectionDto {
  clockIn?: string;
  clockOut?: string;
  managerId: string;
  correctionReason: string;
}

export interface CreateCorrectionDto {
  employeeId: string;
  attendanceRecord: string; // MongoDB ObjectId reference
  reason?: string;
  status?: CorrectionStatus;
}

// Models matching backend schemas
export interface Punch {
  type: PunchType;
  time: Date | string;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string | Date;
  punches: Punch[];
  totalWorkMinutes: number;
  hasMissedPunch: boolean;
  exceptionIds: string[];
  finalisedForPayroll: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceCorrectionRequest {
  _id: string;
  employeeId: string;
  attendanceRecord: string; // MongoDB ObjectId reference
  reason?: string;
  status: CorrectionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftDefinition {
  _id: string;
  name: string;
  shiftType: string; // MongoDB ObjectId reference
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  graceInMinutes?: number;
  graceOutMinutes?: number;
  punchPolicy?: string;
  requiresApprovalForOvertime?: boolean;
  active: boolean;
}

export enum ShiftAssignmentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface ShiftAssignment {
  _id: string;
  employeeId: string;
  shiftId: string;
  startDate: string;
  endDate?: string;
  status: ShiftAssignmentStatus;
  isActive?: boolean;
}

export interface OvertimeRule {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  approved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LatenessRule {
  _id: string;
  name: string;
  description?: string;
  gracePeriodMinutes: number;
  deductionForEachMinute: number;
  active: boolean;
}

export enum HolidayType {
  NATIONAL = "NATIONAL",
  ORGANIZATIONAL = "ORGANIZATIONAL",
  WEEKLY_REST = "WEEKLY_REST",
}

export interface Holiday {
  _id: string;
  type: HolidayType;
  startDate: string;
  endDate?: string;
  name?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeException {
  _id: string;
  employeeId: string;
  attendanceRecordId: string;
  assignedTo: string;
  type: TimeExceptionType;
  reason?: string;
  status: TimeExceptionStatus;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeExceptionDto {
  employeeId: string;
  type: TimeExceptionType;
  attendanceRecordId: string;
  assignedTo: string;
  status?: TimeExceptionStatus;
  reason?: string;
}

// Response types
export interface DailyReportResponse {
  date: string;
  attendanceRecords: (AttendanceRecord & {
    employee?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  })[];
  summary: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalMissedPunch: number;
  };
}

export interface MonthlyReportResponse {
  employeeId: string;
  month: number;
  year: number;
  attendanceRecords: AttendanceRecord[];
  summary: {
    totalWorkingDays: number;
    daysPresent: number;
    daysAbsent: number;
    totalLateCount: number;
    totalOvertimeMinutes: number;
    totalWorkMinutes: number;
  };
}

// Create/Update DTOs
export interface CreateShiftDto {
  name: string;
  shiftType: string; // MongoDB ObjectId
  startTime: string;
  endTime: string;
  graceInMinutes?: number;
  graceOutMinutes?: number;
  punchPolicy?: string;
  requiresApprovalForOvertime?: boolean;
  active?: boolean;
}

export interface UpdateShiftDto extends Partial<CreateShiftDto> { }

export interface AssignShiftDto {
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  shiftId: string;
  scheduleRuleId?: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateShiftAssignmentDto {
  endDate?: string;
  status?: ShiftAssignmentStatus;
}

export interface CreateOvertimeRuleDto {
  name: string;
  description?: string;
  active?: boolean;
  approved?: boolean;
}

export interface UpdateOvertimeRuleDto extends Partial<CreateOvertimeRuleDto> { }

export interface CreateLatenessRuleDto {
  name: string;
  description?: string;
  gracePeriodMinutes?: number;
  deductionForEachMinute?: number;
  active?: boolean;
}

export interface UpdateLatenessRuleDto extends Partial<CreateLatenessRuleDto> { }

export interface CreateHolidayDto {
  type: HolidayType;
  startDate: string;
  endDate?: string;
  name?: string;
  active?: boolean;
}

export interface UpdateHolidayDto {
  type?: HolidayType;
  startDate?: string;
  endDate?: string;
  name?: string;
  active?: boolean;
}

// Schedule Rules
export interface ScheduleRule {
  _id: string;
  name: string;
  pattern: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRuleDto {
  name: string;
  pattern: string;
  active?: boolean;
}

export interface UpdateScheduleRuleDto extends Partial<CreateScheduleRuleDto> { }
