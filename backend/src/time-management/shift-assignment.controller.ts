import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ShiftAssignmentService } from './shift-assignment.service';
import { AssignShiftDto, UpdateShiftAssignmentDto } from './dto';
import { JwtAuthGuard, PermissionsGuard, Permissions, CurrentUser } from '../auth';
import { Permission } from '../auth';
import type { AuthUser } from '../auth';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftAssignmentController {
    constructor(private readonly shiftAssignmentService: ShiftAssignmentService) { }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.MANAGE_ATTENDANCE)
    @Post('assign')
    assignShift(@Body() assignShiftDto: AssignShiftDto, @CurrentUser() user: AuthUser) {
        return this.shiftAssignmentService.assignShift(assignShiftDto);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.VIEW_OWN_ATTENDANCE, Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Get('my')
    findMyShifts(@Query('employeeId') employeeId: string | undefined, @CurrentUser() user: AuthUser) {
        // Auto-fill employeeId from current user if not provided
        if (!employeeId) {
            if (!user.employeeId) {
                throw new BadRequestException('Employee ID is required. Please provide employeeId or ensure your account is linked to an employee.');
            }
            employeeId = user.employeeId;
        }
        
        // Ensure employees can only view their own shifts unless they have team/admin permissions
        const hasTeamAccess = user.permissions?.some(
            (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
        );
        const isOwnShift = user.employeeId && user.employeeId === employeeId;
        
        if (!isOwnShift && !hasTeamAccess) {
            throw new BadRequestException('You can only view your own shift assignments');
        }
        
        return this.shiftAssignmentService.findMyShifts(employeeId);
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.shiftAssignmentService.findAll();
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.VIEW_TEAM_ATTENDANCE, Permission.MANAGE_ATTENDANCE)
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid shift assignment ID');
        }
        
        const assignment = await this.shiftAssignmentService.findOne(id);
        
        // Ensure employees can only view their own assignments unless they have team/admin permissions
        const hasTeamAccess = user.permissions?.some(
            (p) => p === Permission.VIEW_TEAM_ATTENDANCE || p === Permission.MANAGE_ATTENDANCE
        );
        const isOwnAssignment = user.employeeId && assignment.employeeId?.toString() === user.employeeId;
        
        if (!isOwnAssignment && !hasTeamAccess) {
            throw new BadRequestException('You can only view your own shift assignments');
        }
        
        return assignment;
    }

    @UseGuards(PermissionsGuard)
    @Permissions(Permission.MANAGE_ATTENDANCE)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateShiftAssignmentDto: UpdateShiftAssignmentDto, @CurrentUser() user: AuthUser) {
        // Validate ID format
        if (!id || id.trim().length === 0) {
            throw new BadRequestException('Invalid shift assignment ID');
        }
        return this.shiftAssignmentService.update(id, updateShiftAssignmentDto);
    }
}
