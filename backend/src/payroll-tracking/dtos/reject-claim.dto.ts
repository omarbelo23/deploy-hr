import { IsOptional, IsString } from 'class-validator';

export class RejectClaimDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
