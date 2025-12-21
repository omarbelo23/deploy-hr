import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PayrollTrackingService } from '../payroll-tracking.service';

@Controller('tax')
export class TaxController {
  constructor(private readonly trackingService: PayrollTrackingService) {}

  @Get('document/:year')
  async downloadTaxDoc(@Param('year') year: string, @Res() res: Response) {
    const sanitizedYear = year.replace(/[^0-9]/g, '').slice(0, 4) || 'current';
    const yearNumber = Number.parseInt(sanitizedYear, 10);
    const totals = await this.trackingService.taxInsuranceReport(
      Number.isFinite(yearNumber) ? yearNumber : undefined,
    );
    const detailLines =
      totals.details?.slice(0, 50).map(
        (d: any, idx: number) =>
          `${idx + 1}. ${d.employee} | Gross: ${d.gross.toFixed(2)} | Tax: ${d.tax.toFixed(
            2,
          )} | Ins(EE): ${d.insurance.toFixed(2)} | Ins(ER): ${d.employerInsurance.toFixed(2)}`,
      ) ?? [];
    const pdf = buildSimplePdf(
      [
        `ANNUAL TAX CERTIFICATE - ${sanitizedYear}`,
        `Generated for payroll compliance. Values are derived from recorded payslips and applied tax/insurance rules.`,
        `Law/Rule References: Income Tax Act 2025, Social Insurance Code 12-B (example placeholders).`,
        '',
        `Total payslips: ${totals.payslips}`,
        `Total gross: ${totals.totalGross.toFixed(2)}`,
        `Total net: ${totals.totalNet.toFixed(2)}`,
        `Employee taxes: ${totals.taxes.toFixed(2)}`,
        `Employee insurance: ${totals.insurance.toFixed(2)}`,
        `Employer insurance: ${totals.employerInsurance.toFixed(2)}`,
        '',
        'Employee breakdown:',
        ...detailLines,
      ].join('\n'),
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=tax-${sanitizedYear}.pdf`,
    });
    res.send(pdf);
  }
}

function buildSimplePdf(text: string): Buffer {
  // Minimal PDF content with the provided text.
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${44 + text.length} >>
stream
BT /F1 24 Tf 72 720 Td (${escapePdf(text)}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000113 00000 n 
0000000282 00000 n 
0000000403 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
512
%%EOF`;
  return Buffer.from(content);
}

function escapePdf(value: string): string {
  return value.replace(/[()\\]/g, (c) => `\\${c}`);
}
