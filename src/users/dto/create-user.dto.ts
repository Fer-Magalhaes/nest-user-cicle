import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao.silva' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'uuid-da-role' })
  @IsUUID()
  roleId: string;
}


