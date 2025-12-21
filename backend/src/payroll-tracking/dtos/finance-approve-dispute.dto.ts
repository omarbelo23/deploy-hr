import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FinanceApproveDisputeDto {
  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @IsOptional()
  @IsString()
  financeNote?: string;
}
