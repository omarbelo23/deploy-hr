import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';

@Injectable()
export class PayrollTrackingService {
  async getPayslips(_user: AuthUser) {
    return [];
  }

  async getSalaryHistory(_user: AuthUser) {
    return [];
  }

  async getPayslipById(_id: string, _user: AuthUser) {
    return null;
  }

  async generatePayslipPdf(_payslip: any): Promise<Buffer> {
    const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 24 Tf 72 720 Td (Payslip PDF not implemented) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000113 00000 n \n0000000282 00000 n \n0000000403 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n512\n%%EOF';
    return Buffer.from(content);
  }

  async taxInsuranceReport(_year?: number) {
    return {
      payslips: 0,
      totalGross: 0,
      totalNet: 0,
      taxes: 0,
      insurance: 0,
      employerInsurance: 0,
      details: [],
    };
  }
}
