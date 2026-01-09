import { Controller, Get, Param, UseGuards, Query, ParseIntPipe, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserPlanDto } from './dto/update-user-plan.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('users')
    async findAllUsers() {
        return this.adminService.findAllUsers();
    }

    @Get('users/:id')
    async findOneUser(@Param('id') id: string) {
        return this.adminService.findOneUser(id);
    }

    @Patch('users/:id/role')
    async updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
        return this.adminService.updateUserRole(id, dto.role);
    }

    @Patch('users/:id/plan')
    async updateUserPlan(@Param('id') id: string, @Body() dto: UpdateUserPlanDto) {
        return this.adminService.updateUserPlan(id, dto.plan, dto.planExpiresAt);
    }

    @Get('logs')
    async getLogs(@Query('lines', new ParseIntPipe({ optional: true })) lines: number = 100) {
        return this.adminService.getSystemLogs(lines);
    }

    @Get('metrics')
    async getMetrics() {
        return this.adminService.getSystemMetrics();
    }
}
