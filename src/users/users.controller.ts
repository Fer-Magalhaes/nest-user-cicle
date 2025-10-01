import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo usuário (apenas staff)',
    description: 'Apenas usuários com staffStatus podem criar usuários',
  })
  create(
    @Body() dto: CreateUserDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersService.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários com RLS',
    description:
      'Staff vê todos os usuários. Não-staff vê apenas ele mesmo.',
  })
  findAll(@Req() req: { user: { sub: string } }) {
    return this.usersService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID com RLS',
    description:
      'Staff pode ver qualquer usuário. Não-staff só pode ver ele mesmo.',
  })
  findOne(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário com RLS',
    description:
      'Staff pode atualizar qualquer usuário. Não-staff só pode atualizar ele mesmo.',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover usuário (apenas staff)',
    description:
      'Apenas usuários com staffStatus podem remover usuários. Não pode remover a si mesmo.',
  })
  remove(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersService.remove(id, req.user.sub);
  }
}


