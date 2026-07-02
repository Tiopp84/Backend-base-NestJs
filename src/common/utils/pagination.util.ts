import { BadRequestException } from '@nestjs/common';

export function getSafeSortBy(sortBy: string, allowedFields: readonly string[]) {
  if (!allowedFields.includes(sortBy)) {
    throw new BadRequestException(`Invalid sort field: ${sortBy}`);
  }

  return sortBy;
}
