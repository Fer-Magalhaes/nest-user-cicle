import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER', description: 'Nome da role' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Gerente com permissões intermediárias',
    description: 'Descrição da role',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
