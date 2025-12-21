import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  ClockInDto,
  ClockOutDto,
  CorrectionDto,
} from './dto/attendance.dto';
import { JwtAuthGuard, PermissionsGuard, Permissions, CurrentUser } from '../auth';
import { Permission } from '../auth';
import type { AuthUser } from '../auth';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.CLOCK_IN_OUT)
  @Post('clock-in')
  @HttpCode(HttpStatus.CREATED)
  async clockIn(@Body() clockInDto: ClockInDto, @CurrentUser() user: AuthUser) {
    // Auto-fill employeeId from current user if not provided
    if (!clockInDto.employeeId) {
      if (!user.employeeId) {
        throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
      }
      clockInDto.employeeId = user.employeeId;
    }
    
    // Ensure users can only clock in for themselves unless they have admin permissions
    const hasManagePermission = user.permissions?.includes(Permission.MANAGE_ATTENDANCE);
    if (!hasManagePermission && clockInDto.employeeId !== user.employeeId) {
      throw new BadRequestException('You can only clock in for yourself');
    }
    
    return await this.attendanceService.clockIn(clockInDto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.CLOCK_IN_OUT)
  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  async clockOut(@Body() clockOutDto: ClockOutDto, @CurrentUser() user: AuthUser) {
    // Auto-fill employeeId from current user if not provided
    if (!clockOutDto.employeeId) {
      if (!user.employeeId) {
        throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
      }
      clockOutDto.employeeId = user.employeeId;
    }
    
    // Ensure users can only clock out for themselves unless they have admin permissions
    const hasManagePermission = user.permissions?.includes(Permission.MANAGE_ATTENDANCE);
    if (!hasManagePermission && clockOutDto.employeeId !== user.employeeId) {
      throw new BadRequestException('You can only clock out for yourself');
    }
    
    return await this.attendanceService.clockOut(clockOutDto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.MANAGE_ATTENDANCE)
  @Patch('correction/:id')
  @HttpCode(HttpStatus.OK)
  async correctAttendance(
    @Param('id') id: string,
    @Body() correctionDto: CorrectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.attendanceService.correctAttendance(id, correctionDto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
  @Get('daily-report')
  async getDailyReport(@Query('date') date: string, @CurrentUser() user: AuthUser) {
    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return await this.attendanceService.getDailyReport(dateObj);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.VIEW_OWN_ATTENDANCE, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
  @Get('monthly-report')
  async getMonthlyReport(
    @Query('employeeId') employeeId: string | undefined,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() user: AuthUser,
  ) {
    // Auto-fill employeeId from current user if not provided
    if (!employeeId) {
      if (!user.employeeId) {
        throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
      }
      employeeId = user.employeeId;
    }
    
    // Ensure employees can only access their own records unless they have team/admin permissions
    const isOwnRecord = user.employeeId && user.employeeId === employeeId;
    const hasTeamAccess = user.permissions?.some(
      (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
    );

    // If not own record and no team access, deny
    if (!isOwnRecord && !hasTeamAccess) {
      throw new BadRequestException('You can only view your own attendance records');
    }

    return await this.attendanceService.getMonthlyReport(
      employeeId,
      month,
      year,
    );
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.CLOCK_IN_OUT, Permission.VIEW_OWN_ATTENDANCE, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
  @Get('today')
  async getTodayAttendance(@Query('employeeId') employeeId: string | undefined, @CurrentUser() user: AuthUser) {
    // Auto-fill employeeId from current user if not provided
    if (!employeeId) {
      if (!user.employeeId) {
        throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
      }
      employeeId = user.employeeId;
    }
    
    // Ensure employees can only access their own records unless they have team/admin permissions
    const isOwnRecord = user.employeeId && user.employeeId === employeeId;
    const hasTeamAccess = user.permissions?.some(
      (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
    );

    // If not own record and no team access, deny
    if (!isOwnRecord && !hasTeamAccess) {
      throw new BadRequestException('You can only view your own attendance records');
    }

    return await this.attendanceService.getTodayAttendance(employeeId);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(Permission.CLOCK_IN_OUT, Permission.VIEW_OWN_ATTENDANCE, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
  @Get('record')
  async getAttendanceByDate(
    @Query('employeeId') employeeId: string | undefined,
    @Query('date') date: string,
    @CurrentUser() user: AuthUser,
  ) {
    // Auto-fill employeeId from current user if not provided
    if (!employeeId) {
      if (!user.employeeId) {
        throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
      }
      employeeId = user.employeeId;
    }
    
    // Ensure employees can only access their own records unless they have team/admin permissions
    const isOwnRecord = user.employeeId && user.employeeId === employeeId;
    const hasTeamAccess = user.permissions?.some(
      (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
    );

    // If not own record and no team access, deny
    if (!isOwnRecord && !hasTeamAccess) {
      throw new BadRequestException('You can only view your own attendance records');
    }

    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return await this.attendanceService.getAttendanceByDate(employeeId, dateObj);
  }
}
