import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class MigrateRoleDto {
  @ApiProperty({
    example: 'uuid-da-role-origem',
    description: 'ID da role de origem',
  })
  @IsNotEmpty()
  @IsUUID()
  from: string;

  @ApiProperty({
    example: 'uuid-da-role-destino',
    description: 'ID da role de destino',
  })
  @IsNotEmpty()
  @IsUUID()
  to: string;
}
