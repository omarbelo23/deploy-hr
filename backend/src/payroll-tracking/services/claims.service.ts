import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { claims, claimsDocument } from '../models/claims.schema';   
import { CreateClaimDto } from '../dtos/create-claim.dto';
import { UpdateClaimDto } from '../dtos/update-claim.dto';
import { ApproveClaimDto } from '../dtos/approve-claim.dto';
import { RejectClaimDto } from '../dtos/reject-claim.dto';
import { FinanceApproveClaimDto } from '../dtos/finance-approve-claim.dto';
import { ClaimStatus } from '../enums/payroll-tracking-enum';
import type { AuthUser } from '../../auth/auth-user.interface';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectModel(claims.name)
    private readonly claimModel: Model<claimsDocument>,
  ) {}

  async create(createClaimDto: CreateClaimDto): Promise<claims> {
    const created = new this.claimModel({
      ...createClaimDto,
      employeeId: createClaimDto.employeeId,
      financeStaffId: createClaimDto.financeStaffId ?? undefined,
    });

    return created.save();
  }

  async findAll(): Promise<claims[]> {
    return this.claimModel
      .find()
      .populate('employeeId')
      .populate('financeStaffId')
      .exec();
  }

  async findOne(id: string): Promise<claims> {
    const claim = await this.claimModel
      .findById(id)
      .populate('employeeId')
      .populate('financeStaffId')
      .exec();

    if (!claim) {
      throw new NotFoundException(`Claim with id "${id}" not found`);
    }

    return claim;
  }

  // Optional: find by business claimId (CLAIM-0001)
  async findByClaimId(claimId: string): Promise<claims> {
    const claim = await this.claimModel
      .findOne({ claimId })
      .populate('employeeId')
      .populate('financeStaffId')
      .exec();

    if (!claim) {
      throw new NotFoundException(`Claim with claimId "${claimId}" not found`);
    }

    return claim;
  }

  async update(id: string, updateClaimDto: UpdateClaimDto): Promise<claims> {
    const updated = await this.claimModel
      .findByIdAndUpdate(id, { $set: updateClaimDto }, { new: true })
      .populate('employeeId')
      .populate('financeStaffId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Claim with id "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.claimModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Claim with id "${id}" not found`);
    }
  }

  async createExpense(createClaimDto: CreateClaimDto, user: AuthUser): Promise<claims> {
    const employeeId = user.employeeId ?? createClaimDto.employeeId;
    return this.create({
      ...createClaimDto,
      employeeId,
    });
  }

  async findAllExpenses(user: AuthUser): Promise<claims[]> {
    if (!user.employeeId) {
      return this.findAll();
    }

    return this.claimModel
      .find({ employeeId: user.employeeId })
      .populate('employeeId')
      .populate('financeStaffId')
      .exec();
  }

  async findOneExpense(id: string, user: AuthUser): Promise<claims> {
    const claim = await this.findOne(id);
    if (user.employeeId && claim.employeeId?.toString() !== user.employeeId) {
      throw new NotFoundException(`Claim with id "${id}" not found`);
    }
    return claim;
  }

  async updateExpense(id: string, updateClaimDto: UpdateClaimDto, user: AuthUser): Promise<claims> {
    if (user.employeeId) {
      await this.findOneExpense(id, user);
    }
    return this.update(id, updateClaimDto);
  }

  async approveExpense(id: string, dto: ApproveClaimDto, user: AuthUser): Promise<claims> {
    if (user.employeeId) {
      await this.findOneExpense(id, user);
    }
    return this.update(id, {
      approvedAmount: dto.approvedAmount,
      resolutionComment: dto.resolutionComment,
      status: ClaimStatus.APPROVED,
    });
  }

  async financeApprove(id: string, dto: FinanceApproveClaimDto, user: AuthUser): Promise<claims> {
    if (user.employeeId) {
      await this.findOneExpense(id, user);
    }
    return this.update(id, {
      approvedAmount: dto.approvedAmount,
      status: ClaimStatus.APPROVED,
      financeStaffId: user.employeeId,
    });
  }

  async rejectExpense(id: string, dto: RejectClaimDto, user: AuthUser): Promise<claims> {
    if (user.employeeId) {
      await this.findOneExpense(id, user);
    }
    return this.update(id, {
      rejectionReason: dto.rejectionReason,
      status: ClaimStatus.REJECTED,
    });
  }

  async removeExpense(id: string, user: AuthUser): Promise<void> {
    if (user.employeeId) {
      await this.findOneExpense(id, user);
    }
    return this.remove(id);
  }
}
