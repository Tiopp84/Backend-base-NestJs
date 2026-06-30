import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { StaffService } from './staff.service';
import { AssignSkillDto } from './dto/assign-skill.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all staff members' })
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager)
  findAllStaff(@Query() paginationDto: PaginationDto) {
    return this.staffService.findAllStaff(paginationDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a skill to an employee' })
  @Post('skills')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager)
  assignSkill(@Body() assignSkillDto: AssignSkillDto) {
    return this.staffService.assignSkill(assignSkillDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a schedule for an employee' })
  @Post('schedules')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager)
  createSchedule(@Body() createScheduleDto: CreateScheduleDto) {
    return this.staffService.createSchedule(createScheduleDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get schedules of an employee' })
  @Get('schedules/:employeeId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  getSchedules(@Param('employeeId') employeeId: string, @Query() paginationDto: PaginationDto) {
    return this.staffService.getSchedules(employeeId, paginationDto);
  }
}
