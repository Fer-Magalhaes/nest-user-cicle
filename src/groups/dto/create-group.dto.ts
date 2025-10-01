import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Equipe de Desenvolvimento' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Equipe responsável pelo desenvolvimento de software',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}


