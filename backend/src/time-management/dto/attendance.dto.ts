import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class ClockInDto {
  @IsString()
  @IsOptional()
  employeeId?: string; // Optional - will be auto-filled from current user if not provided

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class ClockOutDto {
  @IsString()
  @IsOptional()
  employeeId?: string; // Optional - will be auto-filled from current user if not provided

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class CorrectionDto {
  @IsOptional()
  @IsDateString()
  clockIn?: string;

  @IsOptional()
  @IsDateString()
  clockOut?: string;

  @IsString()
  @IsNotEmpty()
  managerId: string;

  @IsString()
  @IsNotEmpty()
  correctionReason: string;
}

export class DailyReportQueryDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class MonthlyReportQueryDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNotEmpty()
  month: number;

  @IsNotEmpty()
  year: number;
}
