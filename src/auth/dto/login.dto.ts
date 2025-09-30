import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email ou username para identificação do usuário',
    example: 'usuario@exemplo.com ou nomeusuario',
  })
  @IsNotEmpty({ message: 'Identificador é obrigatório' })
  @IsString({ message: 'Identificador deve ser uma string' })
  identifier: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'minhasenha123',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}
