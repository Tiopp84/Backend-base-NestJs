import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new invoice' })
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee, Role.Customer)
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user invoices' })
  @Get('me')
  @UseGuards(AuthGuard)
  findMyInvoices(@Req() req: any, @Query() paginationDto: PaginationDto) {
    return this.invoicesService.findByCustomerId(req.user.sub, paginationDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invoices' })
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.invoicesService.findAll(paginationDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an invoice by id' })
  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update invoice status' })
  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee, Role.Customer)
  updateStatus(@Param('id') id: string, @Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto, @Req() req: any) {
    return this.invoicesService.updateStatus(id, updateInvoiceStatusDto, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update invoice (Unified Checkout)' })
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager)
  update(
    @Param('id') id: string,
    @Body() updateDto: { totalAmount?: number; paymentMethod?: string; status?: string },
  ) {
    return this.invoicesService.update(id, updateDto);
  }
}

