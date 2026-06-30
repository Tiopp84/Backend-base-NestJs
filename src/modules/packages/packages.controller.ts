import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
    constructor(
        private readonly packageService: PackagesService
    ) { }

    @ApiOperation({ summary: 'Get all packages' })
    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.packageService.findAll(paginationDto);
    }


    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new package' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Manager)
    @Post()
    create(@Body() createPackageDto: CreatePackageDto) {
        return this.packageService.create(createPackageDto);
    }
    @ApiOperation({ summary: 'Get a package by id' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.packageService.findOne(id);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a package by id' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Manager)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
        return this.packageService.update(id, updatePackageDto);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a package by id' })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Manager)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.packageService.remove(id);
    }
}
