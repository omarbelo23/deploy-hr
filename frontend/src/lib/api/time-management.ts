import { apiClient } from "../api-client";
import type {
  ClockInDto,
  ClockOutDto,
  AttendanceRecord,
  DailyReportResponse,
  MonthlyReportResponse,
  AttendanceCorrectionRequest,
  CreateCorrectionDto,
  ShiftDefinition,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftAssignment,
  AssignShiftDto,
  UpdateShiftAssignmentDto,
  OvertimeRule,
  CreateOvertimeRuleDto,
  UpdateOvertimeRuleDto,
  LatenessRule,
  CreateLatenessRuleDto,
  UpdateLatenessRuleDto,
  Holiday,
  CreateHolidayDto,
  UpdateHolidayDto,
  TimeException,
  CreateTimeExceptionDto,
  ShiftTypeModel,
  CreateShiftTypeDto,
  UpdateShiftTypeDto,
  ScheduleRule,
  CreateScheduleRuleDto,
  UpdateScheduleRuleDto,
} from "@/types/time-management";

// ==================== ATTENDANCE ====================
export const attendanceApi = {
  async clockIn(data?: Partial<ClockInDto>): Promise<AttendanceRecord> {
    // employeeId is optional - backend will auto-fill from current user
    const response = await apiClient.post<AttendanceRecord>(
      "/attendance/clock-in",
      data || {}
    );
    return response.data;
  },

  async clockOut(data?: Partial<ClockOutDto>): Promise<AttendanceRecord> {
    // employeeId is optional - backend will auto-fill from current user
    const response = await apiClient.post<AttendanceRecord>(
      "/attendance/clock-out",
      data || {}
    );
    return response.data;
  },

  async getDailyReport(date: string): Promise<DailyReportResponse> {
    const response = await apiClient.get<DailyReportResponse>(
      "/attendance/daily-report",
      {
        params: { date },
      }
    );
    return response.data;
  },

  async getMonthlyReport(
    month: number,
    year: number,
    employeeId?: string
  ): Promise<MonthlyReportResponse> {
    // employeeId is optional - backend will auto-fill from current user
    const params: any = { month, year };
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiClient.get<MonthlyReportResponse>(
      "/attendance/monthly-report",
      { params }
    );
    return response.data;
  },

  async getTodayAttendance(employeeId?: string): Promise<AttendanceRecord | null> {
    // employeeId is optional - backend will auto-fill from current user
    const params: any = {};
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiClient.get<AttendanceRecord | null>(
      "/attendance/today",
      { params }
    );
    return response.data;
  },

  async getAttendanceByDate(date: string, employeeId?: string): Promise<AttendanceRecord | null> {
    // employeeId is optional - backend will auto-fill from current user
    const params: any = { date };
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiClient.get<AttendanceRecord | null>(
      "/attendance/record",
      { params }
    );
    return response.data;
  },
};

// ==================== ATTENDANCE CORRECTIONS ====================
export const correctionApi = {
  async createRequest(
    data: Partial<CreateCorrectionDto>
  ): Promise<AttendanceCorrectionRequest> {
    // employeeId is optional - backend will auto-fill from current user
    const response = await apiClient.post<AttendanceCorrectionRequest>(
      "/attendance/corrections",
      data
    );
    return response.data;
  },

  async getAllRequests(): Promise<AttendanceCorrectionRequest[]> {
    const response = await apiClient.get<AttendanceCorrectionRequest[]>(
      "/attendance/corrections"
    );
    return response.data;
  },

  async approveByManager(id: string): Promise<AttendanceCorrectionRequest> {
    const response = await apiClient.patch<AttendanceCorrectionRequest>(
      `/attendance/corrections/${id}/manager`
    );
    return response.data;
  },

  async approveByHR(id: string): Promise<AttendanceCorrectionRequest> {
    const response = await apiClient.patch<AttendanceCorrectionRequest>(
      `/attendance/corrections/${id}/hr`
    );
    return response.data;
  },

  async reject(id: string): Promise<AttendanceCorrectionRequest> {
    const response = await apiClient.patch<AttendanceCorrectionRequest>(
      `/attendance/corrections/${id}/reject`
    );
    return response.data;
  },
};

// ==================== SHIFT DEFINITIONS ====================
export const shiftDefinitionApi = {
  async create(data: CreateShiftDto): Promise<ShiftDefinition> {
    const response = await apiClient.post<ShiftDefinition>(
      "/shift-definitions",
      data
    );
    return response.data;
  },

  async getAll(): Promise<ShiftDefinition[]> {
    const response = await apiClient.get<ShiftDefinition[]>(
      "/shift-definitions"
    );
    return response.data;
  },

  async getById(id: string): Promise<ShiftDefinition> {
    const response = await apiClient.get<ShiftDefinition>(
      `/shift-definitions/${id}`
    );
    return response.data;
  },

  async update(id: string, data: UpdateShiftDto): Promise<ShiftDefinition> {
    const response = await apiClient.patch<ShiftDefinition>(
      `/shift-definitions/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/shift-definitions/${id}`);
  },
};

// ==================== SHIFT TYPES ====================
export const shiftTypeApi = {
  async create(data: CreateShiftTypeDto): Promise<ShiftTypeModel> {
    const response = await apiClient.post<ShiftTypeModel>("/shift-types", data);
    return response.data;
  },

  async getAll(): Promise<ShiftTypeModel[]> {
    const response = await apiClient.get<ShiftTypeModel[]>("/shift-types");
    return response.data;
  },

  async getById(id: string): Promise<ShiftTypeModel> {
    const response = await apiClient.get<ShiftTypeModel>(`/shift-types/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateShiftTypeDto): Promise<ShiftTypeModel> {
    const response = await apiClient.patch<ShiftTypeModel>(`/shift-types/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/shift-types/${id}`);
  },
};

// ==================== SHIFT ASSIGNMENTS ====================
export const shiftAssignmentApi = {
  async assign(data: AssignShiftDto): Promise<ShiftAssignment> {
    const response = await apiClient.post<ShiftAssignment>(
      "/shifts/assign",
      data
    );
    return response.data;
  },

  async getMyShifts(employeeId?: string): Promise<ShiftAssignment[]> {
    // employeeId is optional - backend will auto-fill from current user
    const params: any = {};
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiClient.get<ShiftAssignment[]>("/shifts/my", {
      params,
    });
    return response.data;
  },

  async getAll(): Promise<ShiftAssignment[]> {
    const response = await apiClient.get<ShiftAssignment[]>("/shifts");
    return response.data;
  },

  async getById(id: string): Promise<ShiftAssignment> {
    const response = await apiClient.get<ShiftAssignment>(`/shifts/${id}`);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateShiftAssignmentDto
  ): Promise<ShiftAssignment> {
    const response = await apiClient.patch<ShiftAssignment>(
      `/shifts/${id}`,
      data
    );
    return response.data;
  },
};

// ==================== OVERTIME RULES ====================
export const overtimeRuleApi = {
  async create(data: CreateOvertimeRuleDto): Promise<OvertimeRule> {
    const response = await apiClient.post<OvertimeRule>(
      "/overtime-rules",
      data
    );
    return response.data;
  },

  async getAll(): Promise<OvertimeRule[]> {
    const response = await apiClient.get<OvertimeRule[]>("/overtime-rules");
    return response.data;
  },

  async getById(id: string): Promise<OvertimeRule> {
    const response = await apiClient.get<OvertimeRule>(`/overtime-rules/${id}`);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateOvertimeRuleDto
  ): Promise<OvertimeRule> {
    const response = await apiClient.patch<OvertimeRule>(
      `/overtime-rules/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/overtime-rules/${id}`);
  },
};

// ==================== LATENESS RULES ====================
export const latenessRuleApi = {
  async create(data: CreateLatenessRuleDto): Promise<LatenessRule> {
    const response = await apiClient.post<LatenessRule>(
      "/lateness-rules",
      data
    );
    return response.data;
  },

  async getAll(): Promise<LatenessRule[]> {
    const response = await apiClient.get<LatenessRule[]>("/lateness-rules");
    return response.data;
  },

  async getById(id: string): Promise<LatenessRule> {
    const response = await apiClient.get<LatenessRule>(
      `/lateness-rules/${id}`
    );
    return response.data;
  },

  async update(
    id: string,
    data: UpdateLatenessRuleDto
  ): Promise<LatenessRule> {
    const response = await apiClient.patch<LatenessRule>(
      `/lateness-rules/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/lateness-rules/${id}`);
  },
};

// ==================== HOLIDAYS ====================
export const holidayApi = {
  async create(data: CreateHolidayDto): Promise<Holiday> {
    const response = await apiClient.post<Holiday>("/holidays", data);
    return response.data;
  },

  async getAll(): Promise<Holiday[]> {
    const response = await apiClient.get<Holiday[]>("/holidays");
    return response.data;
  },

  async getById(id: string): Promise<Holiday> {
    const response = await apiClient.get<Holiday>(`/holidays/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateHolidayDto): Promise<Holiday> {
    const response = await apiClient.patch<Holiday>(`/holidays/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/holidays/${id}`);
  },
};

// ==================== TIME EXCEPTIONS ====================
export const timeExceptionApi = {
  async create(data: Partial<CreateTimeExceptionDto>): Promise<TimeException> {
    // employeeId is optional - backend will auto-fill from current user
    const response = await apiClient.post<TimeException>("/exceptions", data);
    return response.data;
  },

  async getAll(): Promise<TimeException[]> {
    const response = await apiClient.get<TimeException[]>("/exceptions");
    return response.data;
  },

  async getById(id: string): Promise<TimeException> {
    const response = await apiClient.get<TimeException>(`/exceptions/${id}`);
    return response.data;
  },

  async approve(id: string): Promise<TimeException> {
    const response = await apiClient.patch<TimeException>(
      `/exceptions/${id}/approve`
    );
    return response.data;
  },

  async reject(id: string): Promise<TimeException> {
    const response = await apiClient.patch<TimeException>(
      `/exceptions/${id}/reject`
    );
    return response.data;
  },
};

// ==================== SCHEDULE RULES ====================
export const scheduleRuleApi = {
  async create(data: CreateScheduleRuleDto): Promise<ScheduleRule> {
    const response = await apiClient.post<ScheduleRule>(
      "/schedule-rules",
      data
    );
    return response.data;
  },

  async getAll(): Promise<ScheduleRule[]> {
    const response = await apiClient.get<ScheduleRule[]>("/schedule-rules");
    return response.data;
  },

  async getById(id: string): Promise<ScheduleRule> {
    const response = await apiClient.get<ScheduleRule>(`/schedule-rules/${id}`);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateScheduleRuleDto
  ): Promise<ScheduleRule> {
    const response = await apiClient.patch<ScheduleRule>(
      `/schedule-rules/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/schedule-rules/${id}`);
  },
};
