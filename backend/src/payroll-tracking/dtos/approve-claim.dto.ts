import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ApproveClaimDto {
  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  resolutionComment?: string;
}
