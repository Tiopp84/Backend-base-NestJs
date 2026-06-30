import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignSkillDto {
    @IsUUID()
    @IsNotEmpty()
    employeeId: string; // ID của nhân viên

    @IsUUID()
    @IsNotEmpty()
    serviceId: string; // ID của dịch vụ nhân viên đó có thể làm
}