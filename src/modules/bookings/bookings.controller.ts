import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee, Role.Customer)
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.create(createBookingDto, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings' })
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  findAll(@Query() paginationDto: PaginationDto, @Req() req: any) {
    const employeeId = req.user.roleName === Role.Employee ? req.user.sub : paginationDto.employeeId;
    return this.bookingsService.findAll(paginationDto, employeeId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by id' })
  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  updateStatus(@Param('id') id: string, @Body() updateBookingStatusDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Allocate staff to a booking detail' })
  @Post('details/:detailId/employees')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager)
  allocateEmployees(
    @Param('detailId') detailId: string,
    @Body('employees') employees: { employeeId: string; roleType: string; commissionEarned: number }[],
  ) {
    return this.bookingsService.allocateEmployees(detailId, employees);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking detail actual times' })
  @Patch('details/:detailId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  updateDetail(
    @Param('detailId') detailId: string,
    @Body() data: { startTime?: string; endTime?: string },
  ) {
    return this.bookingsService.updateDetail(detailId, data);
  }
}
