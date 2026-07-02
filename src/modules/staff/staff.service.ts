import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
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
                where: {
                    role: {
                        roleName: 'Employee',
                    },
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: order } as any,
                select: {
                    ...userSafeFields,
                    skills: {
                        include: {
                            service: true
                        }
                    }
                },
            }),
            this.prisma.user.count({
                where: {
                    role: {
                        roleName: 'Employee',
                    },
                },
            }),
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

    async removeSkill(employeeId: string, serviceId: string) {
        return this.prisma.employeeSkill.deleteMany({
            where: {
                employeeId,
                serviceId,
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

    async updateSchedule(id: string, data: { workDate?: string; startTime?: string; endTime?: string; status?: string }, userPayload?: any) {
        const schedule = await this.prisma.employeeSchedule.findUnique({ where: { id } });
        if (!schedule) throw new NotFoundException('Không tìm thấy ca trực');

        if (userPayload && userPayload.roleName === 'Employee') {
            if (schedule.employeeId !== userPayload.sub) {
                throw new ForbiddenException('Bạn chỉ có quyền xin nghỉ phép cho ca trực của chính mình');
            }
            if (data.status !== 'LEAVE') {
                throw new BadRequestException('Nhân viên chỉ được phép đổi trạng thái sang xin nghỉ phép (LEAVE)');
            }
        }

        return this.prisma.employeeSchedule.update({
            where: { id },
            data: {
                workDate: data.workDate ? new Date(data.workDate) : undefined,
                startTime: data.startTime ? new Date(data.startTime) : undefined,
                endTime: data.endTime ? new Date(data.endTime) : undefined,
                status: data.status,
            },
        });
    }

    async deleteSchedule(id: string) {
        return this.prisma.employeeSchedule.delete({
            where: { id },
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
