import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignSkillDto } from './dto/assign-skill.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class StaffService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async findAllStaff() {
        return this.prisma.user.findMany({
            where: { roleId: '' }
        });
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

    async getSchedules(employeeId: string) {
        return this.prisma.employeeSchedule.findMany({
            where: { employeeId },
        });
    }
}
