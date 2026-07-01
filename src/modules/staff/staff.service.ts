import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignSkillDto } from './dto/assign-skill.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { userSafeFields } from '../users/users.service';

@Injectable()
export class StaffService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAllStaff(paginationDto: PaginationDto) {
        const { page, limit, sortBy, order } = paginationDto;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { roleId: '' },
                skip,
                take: limit,
                orderBy: { [sortBy]: order } as any,
                select: userSafeFields,
            }),
            this.prisma.user.count({ where: { roleId: '' } }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async assignSkill(data: AssignSkillDto) {
        return this.prisma.employeeSkill.create({
            data: {
                employeeId: data.employeeId,
                serviceId: data.serviceId,
            },
        });
    }

    async createSchedule(data: CreateScheduleDto) {
        return this.prisma.employeeSchedule.create({
            data: {
                employeeId: data.employeeId,
                workDate: new Date(data.workDate),
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                status: data.status,
            },
        });
    }

    async getSchedules(employeeId: string, paginationDto: PaginationDto) {
        const { page, limit, sortBy, order } = paginationDto;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.employeeSchedule.findMany({
                where: { employeeId },
                skip,
                take: limit,
                orderBy: { [sortBy]: order },
            }),
            this.prisma.employeeSchedule.count({ where: { employeeId } }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
