import { Controller, Get, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    async findAllUsers() {
        return this.adminService.findAllUsers();
    }

    @Get('users/:id')
    async findOneUser(@Param('id') id: string) {
        return this.adminService.findOneUser(id);
    }

    @Get('logs')
    async getLogs(@Query('lines', new ParseIntPipe({ optional: true })) lines: number = 100) {
        return this.adminService.getSystemLogs(lines);
    }
}
