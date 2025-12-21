import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CorrectionRequestStatus } from '../models/enums';

export class CreateCorrectionDto {
    @IsMongoId()
    @IsOptional()
    employeeId?: string; // Optional - will be auto-filled from current user if not provided

    @IsMongoId()
    @IsNotEmpty()
    attendanceRecord: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsEnum(CorrectionRequestStatus)
    @IsOptional()
    status?: CorrectionRequestStatus;
}

export class UpdateCorrectionDto extends PartialType(CreateCorrectionDto) {}

