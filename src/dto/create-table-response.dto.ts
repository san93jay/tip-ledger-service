import { ApiProperty } from '@nestjs/swagger';

export class TableResponseDto {
  @ApiProperty({ example: 'cf042c8f-a341-4840-aa26-d08235eba7fa' })
  id: string;

  @ApiProperty({ example: 'T1' })
  code: string;
}
