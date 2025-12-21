import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TimeExceptionType, TimeExceptionStatus } from '../models/enums';

export class CreateTimeExceptionDto {
    @IsMongoId()
    @IsOptional()
    employeeId?: string; // Optional - will be auto-filled from current user if not provided

    @IsEnum(TimeExceptionType)
    @IsNotEmpty()
    type: TimeExceptionType;

    @IsMongoId()
    @IsNotEmpty()
    attendanceRecordId: string;

    @IsMongoId()
    @IsNotEmpty()
    assignedTo: string;

    @IsEnum(TimeExceptionStatus)
    @IsOptional()
    status?: TimeExceptionStatus;

    @IsString()
    @IsOptional()
    reason?: string;
}

export class UpdateTimeExceptionDto extends PartialType(CreateTimeExceptionDto) {}

