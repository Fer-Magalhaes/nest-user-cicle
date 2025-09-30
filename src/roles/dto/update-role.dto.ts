import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'MANAGER',
    description: 'Nome da role',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Gerente com permissões intermediárias',
    description: 'Descrição da role',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
