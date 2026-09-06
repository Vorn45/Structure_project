// ===========================================================================>> Core Library
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import express from 'express';

// ===========================================================================>> Custom Library
import { AdminService } from './admin.service';
import {
    QueryAdminDto,
    CreateAdminUserDto,
    UpdateAdminUserDto,
    UpdateProjectBudgetDto,
    UpdateProjectLeadDto,
    LeaveActionDto,
    UpdateSettingsDto,
} from './admin.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly _adminService: AdminService) {}

    // =========================================================================
    // 1. DASHBOARD & STATS
    // =========================================================================
    @Get('stats')
    async getDashboardStats(@Res({ passthrough: true }) res: express.Response) {
        return this._adminService.getDashboardStats(res.locals.user);
    }

    // =========================================================================
    // 2. USERS MANAGEMENT
    // =========================================================================
    @Get('users')
    async getUsers(
        @Query() query: QueryAdminDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.getUsers(res.locals.user, query);
    }

    @Post('users')
    async createUser(
        @Body() dto: CreateAdminUserDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.createUser(res.locals.user, dto);
    }

    @Patch('users/:id')
    async updateUser(
        @Param('id') id: number,
        @Body() dto: UpdateAdminUserDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.updateUser(res.locals.user, id, dto);
    }

    @Patch('users/:id/toggle-status')
    async toggleUserStatus(
        @Param('id') id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.toggleUserStatus(res.locals.user, id);
    }

    @Delete('users/:id')
    async deleteUser(
        @Param('id') id: number,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.deleteUser(res.locals.user, id);
    }

    // =========================================================================
    // 3. PROJECT GOVERNANCE (គម្រោង)
    // =========================================================================
    @Get('projects')
    async getProjects(
        @Query() query: QueryAdminDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.getProjects(res.locals.user, query);
    }

    @Get('projects/:id')
    async getProjectById(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.getProjectById(res.locals.user, id);
    }

    @Post('projects')
    async createProject(
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.createProject(res.locals.user, dto);
    }

    @Patch('projects/:id')
    async updateProject(
        @Param('id') id: string,
        @Body() dto: any,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.updateProject(res.locals.user, id, dto);
    }

    @Delete('projects/:id')
    async deleteProject(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.deleteProject(res.locals.user, id);
    }

    @Patch('projects/:id/budget')
    async updateProjectBudget(
        @Param('id') id: string,
        @Body() dto: UpdateProjectBudgetDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.updateProjectBudget(res.locals.user, id, dto);
    }

    @Patch('projects/:id/lead')
    async updateProjectLead(
        @Param('id') id: string,
        @Body() dto: UpdateProjectLeadDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.updateProjectLead(res.locals.user, id, dto);
    }

    // =========================================================================
    // 4. ATTENDANCE & LEAVES
    // =========================================================================
    @Get('attendance')
    async getAttendanceOverview(@Res({ passthrough: true }) res: express.Response) {
        return this._adminService.getAttendanceOverview(res.locals.user);
    }

    @Get('leaves')
    async getLeaveRequests(@Res({ passthrough: true }) res: express.Response) {
        return this._adminService.getLeaveRequests(res.locals.user);
    }

    @Patch('leaves/:id/action')
    async actionLeaveRequest(
        @Param('id') id: string,
        @Body() dto: LeaveActionDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.actionLeaveRequest(res.locals.user, id, dto);
    }

    // =========================================================================
    // 5. SETTINGS & ORGANIZATION
    // =========================================================================
    @Get('settings')
    async getSettings(@Res({ passthrough: true }) res: express.Response) {
        return this._adminService.getSettings(res.locals.user);
    }

    @Patch('settings')
    async updateSettings(
        @Body() dto: UpdateSettingsDto,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        return this._adminService.updateSettings(res.locals.user, dto);
    }
}
