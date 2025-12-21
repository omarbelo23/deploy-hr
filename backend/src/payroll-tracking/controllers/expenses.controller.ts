import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClaimsService } from '../services/claims.service';
import { CreateClaimDto } from '../dtos/create-claim.dto';
import { UpdateClaimDto } from '../dtos/update-claim.dto';
import { ApproveClaimDto } from '../dtos/approve-claim.dto';
import { RejectClaimDto } from '../dtos/reject-claim.dto';
import { claims } from '../models/claims.schema';
import { CurrentUser, JwtAuthGuard } from '../../auth';
import type { AuthUser } from '../../auth/auth-user.interface';
import { FinanceApproveClaimDto } from '../dtos/finance-approve-claim.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  create(
    @Body() createClaimDto: CreateClaimDto,
    @CurrentUser() user: AuthUser,
  ): Promise<claims> {
    return this.claimsService.createExpense(createClaimDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<claims[]> {
    return this.claimsService.findAllExpenses(user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<claims> {
    return this.claimsService.findOneExpense(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClaimDto: UpdateClaimDto,
    @CurrentUser() user: AuthUser,
  ): Promise<claims> {
    return this.claimsService.updateExpense(id, updateClaimDto, user);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveClaimDto,
    @CurrentUser() user: AuthUser,
  ): Promise<claims> {
    return this.claimsService.approveExpense(id, dto, user);
  }

  @Post(':id/finance-approve')
  financeApprove(
    @Param('id') id: string,
    @Body() dto: FinanceApproveClaimDto,
    @CurrentUser() user: AuthUser,
  ): Promise<claims> {
    return this.claimsService.financeApprove(id, dto, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() rejectClaimDto: RejectClaimDto,
    @CurrentUser() user: AuthUser,
  ): Promise<claims> {
    return this.claimsService.rejectExpense(id, rejectClaimDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.claimsService.removeExpense(id, user);
  }
}
