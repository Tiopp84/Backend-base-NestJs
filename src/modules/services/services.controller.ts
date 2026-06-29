import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('services')
export class ServicesController {
    constructor(
        private readonly servicesService: ServicesService
    ) { }

    @Get()
    findAll() {
        return this.servicesService.findAll();
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(1, 2) // Admin, Manager
    @Post()
    create(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(createServiceDto);
    }
}
