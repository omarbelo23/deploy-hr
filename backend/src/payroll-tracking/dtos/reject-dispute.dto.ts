import { IsOptional, IsString } from 'class-validator';

export class RejectDisputeDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
