import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'João Silva', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'joao.silva', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'joao@exemplo.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'novaSenha123', required: false, minLength: 6 })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'uuid-da-role', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}


