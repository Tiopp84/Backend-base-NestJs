import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePackageDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên gói liệu trình không được để trống' })
    packageName: string;

    @IsNumber({}, { message: 'Tổng số buổi phải là một con số' })
    @Min(1, { message: 'Gói phải có ít nhất 1 buổi' })
    totalSessions: number;

    @IsNumber({}, { message: 'Giá tiền phải là một con số' })
    @Min(0, { message: 'Giá tiền không được âm' })
    price: number;
}