import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ApproveDisputeDto {
  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @IsOptional()
  @IsString()
  resolutionComment?: string;
}
