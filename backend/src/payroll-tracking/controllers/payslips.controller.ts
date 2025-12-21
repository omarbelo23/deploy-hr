import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PayrollTrackingService } from '../payroll-tracking.service';
import { CurrentUser, JwtAuthGuard } from '../../auth';
import type { AuthUser } from '../../auth/auth-user.interface';

@Controller('payslips')
@UseGuards(JwtAuthGuard)
export class PayslipsController {
  constructor(private readonly payrollTrackingService: PayrollTrackingService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return this.payrollTrackingService.getPayslips(user);
  }

  @Get('history')
  async history(@CurrentUser() user: AuthUser) {
    return this.payrollTrackingService.getSalaryHistory(user);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payrollTrackingService.getPayslipById(id, user);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const payslip = await this.payrollTrackingService.getPayslipById(id, user);
    const pdfBuffer = await this.payrollTrackingService.generatePayslipPdf(payslip);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=payslip-${id}.pdf`,
    });
    res.send(pdfBuffer);
  }
}
