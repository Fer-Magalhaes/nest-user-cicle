import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty({ example: 'Equipe de Desenvolvimento', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Equipe responsável pelo desenvolvimento de software',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}


