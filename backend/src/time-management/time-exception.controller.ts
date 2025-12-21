import { Body, Controller, Get, Param, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { TimeExceptionService } from './time-exception.service';
import { CreateTimeExceptionDto, UpdateTimeExceptionDto } from './dto';
import { TimeExceptionStatus } from './models/enums';
import { JwtAuthGuard, PermissionsGuard, Permissions, CurrentUser } from '../auth';
import { Permission } from '../auth';
import type { AuthUser } from '../auth';

@Controller('exceptions')
@UseGuards(JwtAuthGuard)
export class TimeExceptionController {
    constructor(private readonly timeExceptionService: TimeExceptionService) { }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.REQUEST_ATTENDANCE_CORRECTION, Permission.MANAGE_ATTENDANCE)
    @Post()
    create(@Body() createTimeExceptionDto: CreateTimeExceptionDto, @CurrentUser() user: AuthUser) {
        // Auto-fill employeeId from current user if not provided
        if (createTimeExceptionDto.employeeId === undefined || createTimeExceptionDto.employeeId === null) {
            if (!user.employeeId) {
                throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
            }
            createTimeExceptionDto.employeeId = user.employeeId;
        }
        
        // Ensure employees can only create exceptions for themselves unless they have admin permissions
        const hasManagePermission = user.permissions?.includes(Permission.MANAGE_ATTENDANCE);
        if (!hasManagePermission && createTimeExceptionDto.employeeId !== user.employeeId) {
            throw new BadRequestException('You can only create time exceptions for yourself');
        }
        
        return this.timeExceptionService.createException(createTimeExceptionDto);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.VIEW_OWN_ATTENDANCE, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        // If user has team/admin permissions, return all exceptions; otherwise, return only own exceptions
        const hasTeamAccess = user.permissions?.some(
            (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
        );

        if (hasTeamAccess) {
            return this.timeExceptionService.getExceptions();
        } else {
            // Return only own exceptions
            if (!user.employeeId) {
                throw new BadRequestException('Employee ID not found. Please ensure your account is linked to an employee.');
            }
            return this.timeExceptionService.getExceptionsByEmployee(user.employeeId);
        }
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.VIEW_OWN_ATTENDANCE, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid exception ID');
        }
        
        const exception = await this.timeExceptionService.getExceptionById(id);
        
        // Ensure employees can only view their own exceptions unless they have team/admin permissions
        const hasTeamAccess = user.permissions?.some(
            (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
        );
        const isOwnException = user.employeeId && exception.employeeId?.toString() === user.employeeId;
        
        if (!isOwnException && !hasTeamAccess) {
            throw new BadRequestException('You can only view your own time exceptions');
        }
        
        return exception;
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.APPROVE_LEAVES, Permission.MANAGE_ATTENDANCE)
    @Patch(':id/approve')
    async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid exception ID');
        }
        return this.timeExceptionService.updateExceptionStatus(id, TimeExceptionStatus.APPROVED);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.APPROVE_LEAVES, Permission.MANAGE_ATTENDANCE)
    @Patch(':id/reject')
    async reject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid exception ID');
        }
        return this.timeExceptionService.updateExceptionStatus(id, TimeExceptionStatus.REJECTED);
    }
}

