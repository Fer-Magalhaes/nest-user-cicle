import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsNotEmpty() name: string;
  @ApiProperty() @IsNotEmpty() username: string;
  @ApiProperty() @IsEmail() email: string;

  @ApiProperty() @MinLength(6) password: string;
  @ApiProperty() @MinLength(6) confirmPassword: string;
}
