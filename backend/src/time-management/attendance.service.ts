import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import {
  AttendanceRecord,
  AttendanceRecordDocument,
  Punch,


  
} from './models/attendance-record.schema';
import { ShiftAssignment, ShiftAssignmentDocument } from './models/shift-assignment.schema';
import { Shift, ShiftDocument } from './models/shift.schema';
import { ClockInDto, ClockOutDto, CorrectionDto } from './dto/attendance.dto';
import { PunchType, ShiftAssignmentStatus } from './models/enums/index';

interface Employee {
  employeeNumber: string;
  [key: string]: any;
}

interface Leave {
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface Offboarding {
  employeeId: string;
  effectiveDate: string;
}

interface DummyShift {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  shiftType: 'normal' | 'overnight' | 'split' | 'rotational';
  gracePeriodMinutes: number;
}

interface DummyShiftAssignment {
  assignmentId: string;
  employeeId: string;
  shiftId: string;
  startDate: string;
  endDate: string | null;
  restDays: string[];
}

export interface MonthlyReportSummary {
  employeeId: string;
  month: number;
  year: number;
  attendanceRecords: AttendanceRecordDocument[];
  summary: {
    totalWorkingDays: number;
    daysPresent: number;
    daysAbsent: number;
    totalLateCount: number;
    totalOvertimeMinutes: number;
    totalWorkMinutes: number;
  };
}

@Injectable()
export class AttendanceService implements OnModuleInit {
  private employees: Employee[] = [];
  private leaves: Leave[] = [];
  private offboardings: Offboarding[] = [];
  private shifts: DummyShift[] = [];
  private shiftAssignments: DummyShiftAssignment[] = [];

  constructor(
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    @InjectModel(Shift.name)
    private shiftModel: Model<ShiftDocument>,
  ) {}

  onModuleInit(): void {
    this.loadDummyData();
  }

  private loadDummyData(): void {
    const dummyDataPath = path.join(process.cwd(), 'dummy-data');

    try {
      const employeesPath = path.join(dummyDataPath, 'employees.json');
      const leavesPath = path.join(dummyDataPath, 'leaves.json');
      const offboardingPath = path.join(dummyDataPath, 'offboarding.json');
      const shiftsPath = path.join(dummyDataPath, 'shifts.json');
      const shiftAssignmentsPath = path.join(
        dummyDataPath,
        'shift-assignments.json',
      );

      if (fs.existsSync(employeesPath)) {
        this.employees = JSON.parse(fs.readFileSync(employeesPath, 'utf-8'));
      }

      if (fs.existsSync(leavesPath)) {
        this.leaves = JSON.parse(fs.readFileSync(leavesPath, 'utf-8'));
      }

      if (fs.existsSync(offboardingPath)) {
        this.offboardings = JSON.parse(
          fs.readFileSync(offboardingPath, 'utf-8'),
        );
      }

      if (fs.existsSync(shiftsPath)) {
        this.shifts = JSON.parse(fs.readFileSync(shiftsPath, 'utf-8'));
      }

      if (fs.existsSync(shiftAssignmentsPath)) {
        this.shiftAssignments = JSON.parse(
          fs.readFileSync(shiftAssignmentsPath, 'utf-8'),
        );
      }
    } catch (error) {
      console.warn('Warning: Could not load dummy data files', error.message);
    }
  }

  private getEmployee(employeeId: string): Employee {
    const employee = this.employees.find((e) => e.employeeNumber === employeeId);
    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${employeeId} not found`,
      );
    }
    return employee;
  }

  private isTerminated(employeeId: string, date: Date): boolean {
    const offboarding = this.offboardings.find(
      (o) => o.employeeId === employeeId,
    );
    if (!offboarding) {
      return false;
    }

    const effectiveDate = new Date(offboarding.effectiveDate);
    effectiveDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= effectiveDate;
  }

  private isOnLeave(employeeId: string, date: Date): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return this.leaves.some((leave) => {
      if (leave.employeeId !== employeeId || leave.status !== 'approved') {
        return false;
      }

      const startDate = new Date(leave.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(leave.endDate);
      endDate.setHours(0, 0, 0, 0);

      return checkDate >= startDate && checkDate <= endDate;
    });
  }

  private async getShiftAssignment(employeeId: string, date: Date): Promise<any> {
    // Normalize the check date to start of day in UTC to match how MongoDB stores dates
    // This ensures we're comparing dates correctly regardless of server timezone
    const checkDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
    
    // Create end of day in UTC for inclusive date range checks
    const checkDateEnd = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23, 59, 59, 999
    ));

    // Convert employeeId to ObjectId if it's a valid ObjectId string
    const employeeObjectId = Types.ObjectId.isValid(employeeId) 
      ? new Types.ObjectId(employeeId) 
      : employeeId;

    // Build query conditions:
    // - startDate must be <= end of check date (assignment has started)
    // - endDate must be null/undefined OR >= start of check date (assignment hasn't ended)
    // Using UTC-normalized dates ensures timezone consistency
    const dateConditions = {
      startDate: { $lte: checkDateEnd }, // Assignment started on or before check date
      $or: [
        { endDate: { $exists: false } }, // No end date (ongoing)
        { endDate: null }, // Null end date (ongoing)
        { endDate: { $gte: checkDate } }, // End date is on or after check date
      ],
    };

    // Query MongoDB for active shift assignments
    // First try to find APPROVED assignment with ObjectId
    let assignment = await this.shiftAssignmentModel.findOne({
      employeeId: employeeObjectId,
      status: ShiftAssignmentStatus.APPROVED,
      ...dateConditions,
    }).exec();

    // If not found, try with string employeeId (in case it's stored as string)
    if (!assignment) {
      assignment = await this.shiftAssignmentModel.findOne({
        employeeId: employeeId,
        status: ShiftAssignmentStatus.APPROVED,
        ...dateConditions,
      }).exec();
    }

    // Debug: If still not found, log what assignments exist for debugging
    if (!assignment) {
      const allAssignments = await this.shiftAssignmentModel.find({
        $or: [
          { employeeId: employeeObjectId },
          { employeeId: employeeId },
        ],
      }).exec();
      
      console.log(`[DEBUG] Found ${allAssignments.length} assignments for employee ${employeeId}`);
      allAssignments.forEach((a: any) => {
        console.log(`[DEBUG] Assignment: status=${a.status}, startDate=${a.startDate}, endDate=${a.endDate}, checkDate=${checkDate.toISOString()}`);
      });
    }

    // If no approved assignment found, check if there's a pending one
    if (!assignment) {
      let pendingAssignment = await this.shiftAssignmentModel.findOne({
        employeeId: employeeObjectId,
        status: ShiftAssignmentStatus.PENDING,
        ...dateConditions,
      }).exec();

      // Try with string employeeId if not found
      if (!pendingAssignment) {
        pendingAssignment = await this.shiftAssignmentModel.findOne({
          employeeId: employeeId,
          status: ShiftAssignmentStatus.PENDING,
          ...dateConditions,
        }).exec();
      }

      if (pendingAssignment) {
        throw new BadRequestException(
          `You have a shift assignment, but it is pending approval. Please contact your manager to approve it.`,
        );
      }

      // Check if there's any assignment at all (for better error message)
      let anyAssignment = await this.shiftAssignmentModel.findOne({
        employeeId: employeeObjectId,
      }).exec();

      if (!anyAssignment) {
        anyAssignment = await this.shiftAssignmentModel.findOne({
          employeeId: employeeId,
        }).exec();
      }

      if (anyAssignment) {
        throw new BadRequestException(
          `You have a shift assignment, but it is not active for ${date.toISOString().split('T')[0]}. Please check the assignment dates.`,
        );
      }

      throw new NotFoundException(
        `No shift assignment found for employee ${employeeId} on ${date.toISOString().split('T')[0]}. Please contact HR to assign a shift.`,
      );
    }

    return assignment;
  }

  private getShift(shiftId: string): DummyShift {
    const shift = this.shifts.find((s) => s.shiftId === shiftId);
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${shiftId} not found`);
    }
    return shift;
  }

  private isRestDay(assignment: any, date: Date): boolean {
    if (!assignment.restDays || !Array.isArray(assignment.restDays)) {
      return false;
    }
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayName = dayNames[date.getDay()];
    return assignment.restDays.includes(dayName);
  }

  async clockIn(clockInDto: ClockInDto): Promise<AttendanceRecordDocument> {
    if (!clockInDto.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    
    const timestamp = clockInDto.timestamp
      ? new Date(clockInDto.timestamp)
      : new Date();
    
    if (isNaN(timestamp.getTime())) {
      throw new BadRequestException('Invalid timestamp format');
    }

    // NOTE: Commented out dummy data validation - using MongoDB employee data instead
    // this.getEmployee(clockInDto.employeeId);

    if (this.isTerminated(clockInDto.employeeId, timestamp)) {
      throw new BadRequestException(
        'Cannot record attendance for terminated employee',
      );
    }

    if (this.isOnLeave(clockInDto.employeeId, timestamp)) {
      throw new BadRequestException(
        'Cannot clock in/out while on approved leave',
      );
    }

    const assignment = await this.getShiftAssignment(clockInDto.employeeId, timestamp);

    if (this.isRestDay(assignment, timestamp)) {
      throw new BadRequestException('Cannot clock in on rest day');
    }

    const dateOnly = new Date(timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    let attendanceRecord = await this.attendanceModel.findOne({
      employeeId: clockInDto.employeeId as any,
      date: dateOnly,
    });

    if (!attendanceRecord) {
      attendanceRecord = new this.attendanceModel({
        employeeId: clockInDto.employeeId,
        date: dateOnly,
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    const clockInPunch: Punch = {
      type: PunchType.IN,
      time: timestamp,
    };

    attendanceRecord.punches.push(clockInPunch);

    attendanceRecord.hasMissedPunch = this.detectMissingPunch(
      attendanceRecord.punches,
    );

    return await attendanceRecord.save();
  }

  async clockOut(clockOutDto: ClockOutDto): Promise<AttendanceRecordDocument> {
    if (!clockOutDto.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    
    const timestamp = clockOutDto.timestamp
      ? new Date(clockOutDto.timestamp)
      : new Date();
    
    if (isNaN(timestamp.getTime())) {
      throw new BadRequestException('Invalid timestamp format');
    }

    // NOTE: Commented out dummy data validation - using MongoDB employee data instead
    // this.getEmployee(clockOutDto.employeeId);

    const dateOnly = new Date(timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    const attendanceRecord = await this.attendanceModel.findOne({
      employeeId: clockOutDto.employeeId as any,
      date: dateOnly,
    });

    if (!attendanceRecord || attendanceRecord.punches.length === 0) {
      throw new BadRequestException('Must clock in before clocking out');
    }

    const clockOutPunch: Punch = {
      type: PunchType.OUT,
      time: timestamp,
    };

    attendanceRecord.punches.push(clockOutPunch);

    const totalMinutes = this.calculateTotalWorkMinutes(
      attendanceRecord.punches,
    );
    attendanceRecord.totalWorkMinutes = totalMinutes;

    attendanceRecord.hasMissedPunch = this.detectMissingPunch(
      attendanceRecord.punches,
    );

    return await attendanceRecord.save();
  }

  async correctAttendance(
    id: string,
    correctionDto: CorrectionDto,
  ): Promise<AttendanceRecordDocument> {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Attendance record ID is required');
    }
    
    const attendanceRecord = await this.attendanceModel.findById(id);

    if (!attendanceRecord) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    if (correctionDto.clockIn) {
      const clockInTime = new Date(correctionDto.clockIn);
      const existingClockIn = attendanceRecord.punches.find(
        (p) => p.type === PunchType.IN,
      );

      if (existingClockIn) {
        existingClockIn.time = clockInTime;
      } else {
        attendanceRecord.punches.unshift({
          type: PunchType.IN,
          time: clockInTime,
        });
      }
    }

    if (correctionDto.clockOut) {
      const clockOutTime = new Date(correctionDto.clockOut);
      const existingClockOut = attendanceRecord.punches.find(
        (p) => p.type === PunchType.OUT,
      );

      if (existingClockOut) {
        existingClockOut.time = clockOutTime;
      } else {
        attendanceRecord.punches.push({
          type: PunchType.OUT,
          time: clockOutTime,
        });
      }
    }

    attendanceRecord.totalWorkMinutes = this.calculateTotalWorkMinutes(
      attendanceRecord.punches,
    );
    attendanceRecord.hasMissedPunch = this.detectMissingPunch(
      attendanceRecord.punches,
    );

    attendanceRecord.markModified('punches');

    return await attendanceRecord.save();
  }

  async getDailyReport(date: Date): Promise<AttendanceRecordDocument[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.attendanceModel
      .find({
        'punches.time': {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .exec();
  }

  async getMonthlyReport(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<MonthlyReportSummary> {
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException('Employee ID is required');
    }
    
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    
    if (year < 1900 || year > 2100) {
      throw new BadRequestException('Year must be a valid year');
    }
    
    // NOTE: Commented out dummy data validation - using MongoDB employee data instead
    // this.getEmployee(employeeId);

    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await this.attendanceModel
      .find({
        employeeId: employeeId as any,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();

    let totalWorkMinutes = 0;

    records.forEach((record) => {
      totalWorkMinutes += record.totalWorkMinutes || 0;
    });

    const daysPresent = records.filter((r) => r.punches.length > 0 && !r.hasMissedPunch).length;
    const totalWorkingDays = new Date(year, month, 0).getDate(); // Total days in month
    const daysAbsent = totalWorkingDays - records.length;

    return {
      employeeId,
      month,
      year,
      attendanceRecords: records,
      summary: {
        totalWorkingDays,
        daysPresent,
        daysAbsent,
        totalLateCount: 0, // TODO: Implement late detection logic
        totalOvertimeMinutes: 0, // TODO: Implement overtime calculation
        totalWorkMinutes,
      },
    };
  }

  private calculateTotalWorkMinutes(punches: Punch[]): number {
    let totalMinutes = 0;
    let clockInTime: Date | null = null;

    for (const punch of punches) {
      if (punch.type === PunchType.IN) {
        clockInTime = punch.time;
      } else if (punch.type === PunchType.OUT && clockInTime) {
        const diffMs = punch.time.getTime() - clockInTime.getTime();
        totalMinutes += Math.floor(diffMs / 60000);
        clockInTime = null;
      }
    }

    return totalMinutes;
  }

  private detectMissingPunch(punches: Punch[]): boolean {
    if (punches.length === 0) return false;

    const clockInCount = punches.filter((p) => p.type === PunchType.IN)
      .length;
    const clockOutCount = punches.filter((p) => p.type === PunchType.OUT)
      .length;

    return clockInCount !== clockOutCount;
  }

  async getTodayAttendance(employeeId: string): Promise<AttendanceRecordDocument | null> {
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException('Employee ID is required');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.attendanceModel.findOne({
      employeeId: employeeId as any,
      date: today,
    }).exec();

    return record;
  }

  async getAttendanceByDate(employeeId: string, date: Date): Promise<AttendanceRecordDocument | null> {
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException('Employee ID is required');
    }
    
    if (!date || isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await this.attendanceModel.findOne({
      employeeId: employeeId as any,
      date: {
        $gte: targetDate,
        $lte: endOfDay,
      },
    }).exec();

    return record;
  }
}
