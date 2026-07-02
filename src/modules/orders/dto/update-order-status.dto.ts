import { IsEnum } from 'class-validator';
import { OrderStatus } from 'src/common/enums/business.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
