import { Body, Controller, Get, Post, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
    constructor(
        private readonly servicesService: ServicesService
    ) { }

    @ApiOperation({ summary: 'Get all services' })
    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.servicesService.findAll(paginationDto);
    }


    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new service' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Manager) // Admin, Manager
    @Post()
    create(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(createServiceDto);
    }

    @ApiOperation({ summary: 'Get a service by id' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.servicesService.findOne(id);
    }


    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a service by id' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Manager)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
        return this.servicesService.update(id, updateServiceDto);
    }


    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a service by id' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Manager)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.servicesService.remove(id);
    }
}
