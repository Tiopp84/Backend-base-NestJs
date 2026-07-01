import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('progress')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new customer progress log' })
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Manager, Role.Employee)
  create(@Body() createProgressDto: CreateProgressDto) {
    return this.progressService.create(createProgressDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer progress logs' })
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() req: any) {
    const userId = req.user.sub;
    const roleName = req.user.roleName;
    return this.progressService.findAll(userId, roleName);
  }
}
