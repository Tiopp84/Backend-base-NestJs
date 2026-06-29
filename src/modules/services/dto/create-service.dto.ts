import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
    serviceName: string;

    @IsNumber({}, { message: 'Thời lượng phải là một con số' })
    @Min(1, { message: 'Thời lượng tối thiểu là 1 phút' })
    durationMin: number;

    @IsNumber({}, { message: 'Giá tiền phải là một con số' })
    @Min(0, { message: 'Giá tiền không được âm' })
    price: number;

    @IsNumber({}, { message: 'Hoa hồng phải là một con số' })
    @Min(0, { message: 'Hoa hồng không được âm' })
    commissionRate: number;
}