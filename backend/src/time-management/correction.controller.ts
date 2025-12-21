import { Body, Controller, Get, Param, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { CorrectionService } from './correction.service';
import { CreateCorrectionDto } from './dto';
import { JwtAuthGuard, PermissionsGuard, Permissions, CurrentUser } from '../auth';
import { Permission } from '../auth';
import type { AuthUser } from '../auth';

@Controller('attendance/corrections')
@UseGuards(JwtAuthGuard)
export class CorrectionController {
    constructor(private readonly correctionService: CorrectionService) { }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.REQUEST_ATTENDANCE_CORRECTION)
    @Post()
    create(@Body() createCorrectionDto: CreateCorrectionDto, @CurrentUser() user: AuthUser) {
        // Auto-fill employeeId from current user if not provided
        if (!createCorrectionDto.employeeId) {
            if (!user.employeeId) {
                throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
            }
            createCorrectionDto.employeeId = user.employeeId;
        }

        // Ensure employees can only create requests for themselves unless they have admin permissions
        const hasManagePermission = user.permissions?.includes(Permission.MANAGE_ATTENDANCE);
        if (!hasManagePermission && createCorrectionDto.employeeId !== user.employeeId) {
            throw new BadRequestException('You can only create correction requests for yourself');
        }

        return this.correctionService.createRequest(createCorrectionDto);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.REQUEST_ATTENDANCE_CORRECTION, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        // If user has team/admin permissions OR is a System Admin/HR Manager, return all requests
        const hasTeamAccess = user.permissions?.some(
            (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
        ) || user.role === 'System Admin' || user.role === 'HR Manager';

        if (hasTeamAccess) {
            return this.correctionService.getCorrectionRequests();
        } else {
            // Return only own requests
            if (!user.employeeId) {
                throw new BadRequestException('Employee ID not found. Please ensure your account is linked to an employee.');
            }
            return this.correctionService.getMyCorrectionRequests(user.employeeId);
        }
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.APPROVE_LEAVES, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Patch(':id/manager')
    async approveByManager(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid correction request ID');
        }
        return this.correctionService.approveByManager(id);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.MANAGE_ATTENDANCE)
    @Patch(':id/hr')
    async approveByHR(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid correction request ID');
        }
        return this.correctionService.approveByHR(id);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.MANAGE_ATTENDANCE, Permission.APPROVE_LEAVES)
    @Patch(':id/reject')
    async reject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid correction request ID');
        }
        return this.correctionService.reject(id);
    }
}

