import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(Role.VIEWER, Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get total income, expenses and net balance — ALL roles' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('categories')
  @Roles(Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get category wise breakdown — ANALYST, ADMIN' })
  @ApiResponse({ status: 200, description: 'Category breakdown retrieved' })
  getCategoryBreakdown() {
    return this.dashboardService.getCategoryBreakdown();
  }

  @Get('trends')
  @Roles(Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get monthly income vs expense trends — ANALYST, ADMIN' })
  @ApiResponse({ status: 200, description: 'Monthly trends retrieved' })
  getMonthlyTrends() {
    return this.dashboardService.getMonthlyTrends();
  }

  @Get('weekly-trends')
  @Roles(Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get weekly income vs expense trends — ANALYST, ADMIN' })
  @ApiResponse({ status: 200, description: 'Weekly trends retrieved' })
  getWeeklyTrends() {
    return this.dashboardService.getWeeklyTrends();
  }

  @Get('top-categories')
  @Roles(Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get top 5 expense categories — ANALYST, ADMIN' })
  @ApiResponse({ status: 200, description: 'Top categories retrieved' })
  getTopCategories() {
    return this.dashboardService.getTopCategories();
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get dashboard summary for a specific user — ADMIN only' })
  @ApiResponse({ status: 200, description: 'User summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserSummary(@Param('userId') userId: string) {
    return this.dashboardService.getUserSummary(userId);
  }
}