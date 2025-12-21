import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FinanceApproveClaimDto {
  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  financeNote?: string;
}
