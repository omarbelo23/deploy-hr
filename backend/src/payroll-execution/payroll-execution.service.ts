import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PayrollStatus } from './enums/payroll-status.enum';
import { PayRollStatus, PayRollPaymentStatus } from './enums/payroll-execution-enum';
import { PayrollCalculationService } from './payroll-calculation.service';

// Import Models
import { payrollRuns, payrollRunsDocument } from './models/payrollRuns.schema';
import { paySlip, PayslipDocument } from './models/payslip.schema';
import { employeePayrollDetails, employeePayrollDetailsDocument } from './models/employeePayrollDetails.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';

// Import DTOs
import { CreatePayrollRunsDto } from './dto/create-payroll-runs.dto';
import { UpdatePayrollRunsDto } from './dto/update-payroll-runs.dto';

@Injectable()
export class PayrollExecutionService {
  constructor(
    private calculationService: PayrollCalculationService,
    @InjectModel(payrollRuns.name) private payrollRunsModel: Model<payrollRunsDocument>,
    @InjectModel(paySlip.name) private paySlipModel: Model<PayslipDocument>,
    @InjectModel(employeePayrollDetails.name) private employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<EmployeeProfileDocument>,
  ) {}

  // =================================================================
  // 1. VIEWING DATA
  // =================================================================

  /**
   * Get pre-run checks before initiating payroll
   * Returns an array of checks that need to be resolved before payroll can be initiated
   */
  async getPreRunChecks() {
    const checks: { id: string; description: string; resolved: boolean; count: number }[] = [];

    // Check 1: Verify all active employees have bank details
    const employeesWithMissingBankDetails = await this.employeeModel.countDocuments({
      status: 'active',
      $or: [
        { bankName: { $exists: false } },
        { bankName: null },
        { bankName: '' },
        { bankAccountNumber: { $exists: false } },
        { bankAccountNumber: null },
        { bankAccountNumber: '' },
      ],
    });

    checks.push({
      id: '1',
      description: 'All active employees have valid bank details',
      resolved: employeesWithMissingBankDetails === 0,
      count: employeesWithMissingBankDetails,
    });

    // Check 2: Verify all employees have a pay grade assigned
    const employeesWithoutPayGrade = await this.employeeModel.countDocuments({
      status: 'active',
      $or: [
        { payGradeId: { $exists: false } },
        { payGradeId: null },
      ],
    });

    checks.push({
      id: '2',
      description: 'All active employees have pay grades assigned',
      resolved: employeesWithoutPayGrade === 0,
      count: employeesWithoutPayGrade,
    });

    // Check 3: Verify all employees have department assigned
    const employeesWithoutDepartment = await this.employeeModel.countDocuments({
      status: 'active',
      $or: [
        { primaryDepartmentId: { $exists: false } },
        { primaryDepartmentId: null },
      ],
    });

    checks.push({
      id: '3',
      description: 'All active employees have departments assigned',
      resolved: employeesWithoutDepartment === 0,
      count: employeesWithoutDepartment,
    });

    // Check 4: Ensure no pending payroll run is currently open
    const pendingPayrollRuns = await this.payrollRunsModel.countDocuments({
      status: { $in: [PayRollStatus.DRAFT, PayRollStatus.UNDER_REVIEW, PayRollStatus.PENDING_FINANCE_APPROVAL] },
    });

    checks.push({
      id: '4',
      description: 'No pending payroll runs in progress',
      resolved: pendingPayrollRuns === 0,
      count: pendingPayrollRuns,
    });

    return checks;
  }

  /**
   * Get draft payroll entries for a specific cycle
   * Returns employee payroll data for review
   */
  async getDraftsByCycleId(cycleId: string) {
    // Validate cycleId
    if (!Types.ObjectId.isValid(cycleId)) {
      throw new BadRequestException('Invalid cycle ID');
    }

    // Get employee payroll details for this payroll run
    const payrollDetails = await this.employeePayrollDetailsModel
      .find({ payrollRunId: new Types.ObjectId(cycleId) })
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeNumber primaryDepartmentId primaryPositionId',
        populate: [
          { path: 'primaryDepartmentId', select: 'name' },
          { path: 'primaryPositionId', select: 'title' },
        ],
      })
      .lean();

    // Transform data for frontend
    return payrollDetails.map((detail: any) => {
      const employee = detail.employeeId;
      return {
        id: employee?._id?.toString() || detail.employeeId?.toString(),
        name: employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : 'Unknown',
        employeeNumber: employee?.employeeNumber || 'N/A',
        role: employee?.primaryPositionId?.title || 'N/A',
        department: employee?.primaryDepartmentId?.name || 'N/A',
        baseSalary: detail.baseSalary || 0,
        allowances: detail.allowances || 0,
        bonus: detail.bonus || 0,
        grossPay: detail.baseSalary + (detail.allowances || 0) + (detail.bonus || 0) + (detail.benefit || 0),
        deductions: detail.deductions || 0,
        netPay: detail.netPay || 0,
        hasByAnomaly: !!detail.exceptions,
        anomalyReason: detail.exceptions || null,
        bankStatus: detail.bankStatus,
        status: detail.exceptions ? 'Flagged' : 'Ready',
      };
    });
  }

  /**
   * Update individual employee payslip (correction)
   */
  async updatePayslip(employeeId: string, data: any) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    // Find the latest payslip for this employee
    const payslip = await this.paySlipModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
    }).sort({ createdAt: -1 });

    if (!payslip) {
      throw new NotFoundException(`Payslip for employee ${employeeId} not found`);
    }

    // Update the payslip with the new data
    const updateData: any = {};
    
    if (data.baseSalary !== undefined) {
      updateData['earningsDetails.baseSalary'] = data.baseSalary;
    }
    if (data.totalGrossSalary !== undefined) {
      updateData.totalGrossSalary = data.totalGrossSalary;
    }
    if (data.totaDeductions !== undefined) {
      updateData.totaDeductions = data.totaDeductions;
    }
    if (data.netPay !== undefined) {
      updateData.netPay = data.netPay;
    }

    const updatedPayslip = await this.paySlipModel.findByIdAndUpdate(
      payslip._id,
      { $set: updateData },
      { new: true }
    );

    // Also update employee payroll details if exists
    await this.employeePayrollDetailsModel.findOneAndUpdate(
      { employeeId: new Types.ObjectId(employeeId), payrollRunId: payslip.payrollRunId },
      { 
        $set: {
          ...(data.baseSalary !== undefined && { baseSalary: data.baseSalary }),
          ...(data.netPay !== undefined && { netPay: data.netPay }),
          ...(data.deductions !== undefined && { deductions: data.deductions }),
          exceptions: null, // Clear the anomaly flag after correction
        }
      },
      { new: true }
    );

    return {
      success: true,
      message: `Payslip for employee ${employeeId} updated successfully`,
      data: updatedPayslip,
    };
  }

  /**
   * Submit payroll for review/approval
   */
  async submitForApproval(runId: string, action: string, comments?: string) {
    if (!Types.ObjectId.isValid(runId)) {
      throw new BadRequestException('Invalid run ID');
    }

    const payrollRun = await this.payrollRunsModel.findById(runId);
    if (!payrollRun) {
      throw new NotFoundException(`Payroll run ${runId} not found`);
    }

    // Update the status to under review
    payrollRun.status = PayRollStatus.UNDER_REVIEW;
    await payrollRun.save();

    return {
      success: true,
      message: `Payroll ${runId} submitted for ${action}`,
      status: PayRollStatus.UNDER_REVIEW,
      runId,
      action,
      comments,
    };
  }

  async getPayrollById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payroll ID');
    }

    const payrollRun = await this.payrollRunsModel.findById(id)
      .populate('payrollSpecialistId', 'firstName lastName')
      .populate('payrollManagerId', 'firstName lastName')
      .populate('financeStaffId', 'firstName lastName')
      .lean();

    if (!payrollRun) {
      throw new NotFoundException(`Payroll run ${id} not found`);
    }

    // Get summary data
    const payrollDetails = await this.employeePayrollDetailsModel.find({
      payrollRunId: new Types.ObjectId(id),
    }).lean();

    const totalGross = payrollDetails.reduce((sum, d) => sum + (d.baseSalary || 0) + (d.allowances || 0) + (d.bonus || 0) + (d.benefit || 0), 0);
    const totalDeductions = payrollDetails.reduce((sum, d) => sum + (d.deductions || 0), 0);
    const totalNetPayable = payrollDetails.reduce((sum, d) => sum + (d.netPay || 0), 0);
    const anomalies = payrollDetails.filter(d => d.exceptions);

    // Build audit log from dates
    const auditLog: { timestamp: Date | string; user: string; action: string }[] = [];
    auditLog.push({
      timestamp: (payrollRun as any).createdAt,
      user: 'System',
      action: 'Payroll Run Created',
    });
    
    if (payrollRun.managerApprovalDate) {
      auditLog.push({
        timestamp: payrollRun.managerApprovalDate,
        user: 'Payroll Manager',
        action: payrollRun.status === PayRollStatus.REJECTED ? 'Rejected by Manager' : 'Approved by Manager',
      });
    }

    if (payrollRun.financeApprovalDate) {
      auditLog.push({
        timestamp: payrollRun.financeApprovalDate,
        user: 'Finance Staff',
        action: payrollRun.paymentStatus === PayRollPaymentStatus.PAID ? 'Approved & Paid' : 'Reviewed by Finance',
      });
    }

    return {
      _id: payrollRun._id,
      id: payrollRun._id.toString(),
      runId: payrollRun.runId,
      period: payrollRun.payrollPeriod,
      status: payrollRun.status,
      paymentStatus: payrollRun.paymentStatus,
      entity: payrollRun.entity,
      isLocked: payrollRun.status === PayRollStatus.LOCKED || payrollRun.paymentStatus === PayRollPaymentStatus.PAID,
      rejectionReason: payrollRun.rejectionReason || null,
      summary: {
        totalGross,
        totalTaxes: totalDeductions,
        totalNetPayable,
        employeeCount: payrollRun.employees,
        exceptionsCount: payrollRun.exceptions,
      },
      anomalies: await Promise.all(anomalies.map(async (a) => {
        const emp = await this.employeeModel.findById(a.employeeId).select('firstName lastName employeeNumber').lean();
        return {
          employeeId: a.employeeId.toString(),
          name: emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown',
          issue: a.exceptions,
        };
      })),
      auditLog,
    };
  }

  // =================================================================
  // 2. SPECIALIST ACTIONS
  // =================================================================
  
  async initiatePayroll(createDto: CreatePayrollRunsDto, userRole: string, userId?: string) {
    // Allow multiple roles to initiate payroll
    const allowedRoles = ['PAYROLL_SPECIALIST', 'Payroll Specialist', 'PAYROLL_MANAGER', 'Payroll Manager', 'SYSTEM_ADMIN', 'System Admin'];
    const normalizedRole = userRole?.toLowerCase().replace(/[\s_]+/g, '');
    const isAllowed = allowedRoles.some(r => r.toLowerCase().replace(/[\s_]+/g, '') === normalizedRole);
    
    if (!isAllowed) {
      throw new ForbiddenException('Only Payroll Specialists, Payroll Managers, or System Admins can initiate payroll');
    }

    const period = (createDto as any).period || (createDto as any).payrollPeriod;

    // Generate unique run ID
    const year = new Date().getFullYear();
    const lastRun = await this.payrollRunsModel
      .findOne({ runId: new RegExp(`^PR-${year}-`) })
      .sort({ runId: -1 })
      .lean();
    
    let nextNumber = 1;
    if (lastRun) {
      const lastNumber = parseInt(lastRun.runId.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }
    const runId = `PR-${year}-${nextNumber.toString().padStart(4, '0')}`;

    // Get active employees count
    const activeEmployees = await this.employeeModel.countDocuments({ status: 'active' });
    
    // Count employees with exceptions (missing bank details, etc.)
    const employeesWithExceptions = await this.employeeModel.countDocuments({
      status: 'active',
      $or: [
        { bankName: { $exists: false } },
        { bankName: null },
        { bankName: '' },
        { bankAccountNumber: { $exists: false } },
        { bankAccountNumber: null },
        { bankAccountNumber: '' },
      ],
    });

    // Get payrollSpecialistId from DTO, or use the userId if not provided
    const specialistId = (createDto as any).payrollSpecialistId || userId;
    if (!specialistId) {
      throw new BadRequestException('Payroll specialist ID is required');
    }

    // Create new payroll run
    const newPayrollRun = new this.payrollRunsModel({
      runId,
      payrollPeriod: period || new Date(),
      status: PayRollStatus.DRAFT,
      entity: (createDto as any).entity || 'Default Company',
      employees: activeEmployees,
      exceptions: employeesWithExceptions,
      totalnetpay: 0, // Will be calculated later
      payrollSpecialistId: new Types.ObjectId(specialistId),
      paymentStatus: PayRollPaymentStatus.PENDING,
    });

    await newPayrollRun.save();

    // Trigger calculation service if available
    if (typeof (this.calculationService as any).calculateDraft === 'function') {
      await (this.calculationService as any).calculateDraft(period);
    }

    return {
      message: 'Payroll Initiated Successfully',
      data: newPayrollRun,
      status: PayRollStatus.DRAFT,
      isLocked: false,
    };
  }

  async updatePayrollDraft(id: string, updateDto: UpdatePayrollRunsDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payroll ID');
    }

    const payrollRun = await this.payrollRunsModel.findById(id);
    if (!payrollRun) {
      throw new NotFoundException(`Payroll run ${id} not found`);
    }

    // Only allow updates if status is DRAFT
    if (payrollRun.status !== PayRollStatus.DRAFT && payrollRun.status !== PayRollStatus.UNLOCKED) {
      throw new BadRequestException('Can only update payroll runs in DRAFT or UNLOCKED status');
    }

    const updatedPayrollRun = await this.payrollRunsModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true }
    );

    return {
      id,
      data: updatedPayrollRun,
      status: updatedPayrollRun?.status,
      message: 'Payroll Updated Successfully'
    };
  }

  async submitForReview(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payroll ID');
    }

    const payrollRun = await this.payrollRunsModel.findById(id);
    if (!payrollRun) {
      throw new NotFoundException(`Payroll run ${id} not found`);
    }

    if (payrollRun.status !== PayRollStatus.DRAFT && payrollRun.status !== PayRollStatus.UNLOCKED) {
      throw new BadRequestException('Can only submit payroll runs in DRAFT or UNLOCKED status for review');
    }

    payrollRun.status = PayRollStatus.UNDER_REVIEW;
    await payrollRun.save();

    return {
      id,
      status: PayRollStatus.UNDER_REVIEW,
      message: 'Submitted for Review Successfully'
    };
  }

  // =================================================================
  // 3. APPROVAL WORKFLOWS
  // =================================================================

  async managerReview(id: string, updateDto: UpdatePayrollRunsDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payroll ID');
    }

    const payrollRun = await this.payrollRunsModel.findById(id);
    if (!payrollRun) {
      throw new NotFoundException(`Payroll run ${id} not found`);
    }

    const approved = (updateDto as any).approved;
    const reason = (updateDto as any).reason;
    const managerId = (updateDto as any).payrollManagerId;

    if (approved) {
      payrollRun.status = PayRollStatus.PENDING_FINANCE_APPROVAL;
      payrollRun.managerApprovalDate = new Date();
      if (managerId) {
        payrollRun.payrollManagerId = new Types.ObjectId(managerId) as any;
      }
      await payrollRun.save();

      return { 
        id, 
        status: PayRollStatus.PENDING_FINANCE_APPROVAL, 
        message: 'Manager Approved Successfully' 
      };
    } else {
      payrollRun.status = PayRollStatus.REJECTED;
      payrollRun.rejectionReason = reason || 'Rejected by manager';
      payrollRun.managerApprovalDate = new Date();
      if (managerId) {
        payrollRun.payrollManagerId = new Types.ObjectId(managerId) as any;
      }
      await payrollRun.save();

      return { 
        id, 
        status: PayRollStatus.REJECTED, 
        rejectionReason: payrollRun.rejectionReason, 
        message: 'Manager Rejected' 
      };
    }
  }

  async financeReview(id: string, updateDto: UpdatePayrollRunsDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payroll ID');
    }

    const payrollRun = await this.payrollRunsModel.findById(id);
    if (!payrollRun) {
      throw new NotFoundException(`Payroll run ${id} not found`);
    }

    const approved = (updateDto as any).approved;
    const reason = (updateDto as any).reason;
    const financeId = (updateDto as any).financeStaffId;

    if (approved) {
      payrollRun.status = PayRollStatus.APPROVED;
      payrollRun.paymentStatus = PayRollPaymentStatus.PAID;
      payrollRun.financeApprovalDate = new Date();
      if (financeId) {
        payrollRun.financeStaffId = new Types.ObjectId(financeId) as any;
      }
      await payrollRun.save();

      // Update all payslips for this run to PAID status
      await this.paySlipModel.updateMany(
        { payrollRunId: payrollRun._id },
        { $set: { paymentStatus: 'paid' } }
      );

      return { 
        id, 
        status: PayRollStatus.APPROVED, 
        paymentStatus: PayRollPaymentStatus.PAID,
        isLocked: true, 
        message: 'Finance Approved - Payroll Executed Successfully' 
      };
    } else {
      payrollRun.status = PayRollStatus.REJECTED;
      payrollRun.rejectionReason = reason || 'Rejected by finance';
      payrollRun.financeApprovalDate = new Date();
      if (financeId) {
        payrollRun.financeStaffId = new Types.ObjectId(financeId) as any;
      }
      await payrollRun.save();

      return { 
        id, 
        status: PayRollStatus.REJECTED, 
        rejectionReason: payrollRun.rejectionReason, 
        message: 'Finance Rejected' 
      };
    }
  }
}