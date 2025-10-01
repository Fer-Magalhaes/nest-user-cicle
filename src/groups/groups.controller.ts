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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('groups')
@Controller('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo grupo (apenas staff)',
    description: 'Apenas usuários com staffStatus podem criar grupos',
  })
  create(
    @Body() dto: CreateGroupDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.groupsService.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar grupos com RLS',
    description:
      'Staff vê todos os grupos. Não-staff vê apenas grupos que faz parte.',
  })
  findAll(@Req() req: { user: { sub: string } }) {
    return this.groupsService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar grupo por ID com RLS',
    description:
      'Staff pode ver qualquer grupo. Não-staff só pode ver grupos que faz parte.',
  })
  findOne(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.groupsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar grupo (apenas staff)',
    description: 'Apenas usuários com staffStatus podem atualizar grupos',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.groupsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover grupo (apenas staff)',
    description: 'Apenas usuários com staffStatus podem remover grupos',
  })
  remove(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.groupsService.remove(id, req.user.sub);
  }

  @Post(':id/users')
  @ApiOperation({
    summary: 'Adicionar usuário ao grupo (apenas staff)',
    description: 'Apenas usuários com staffStatus podem adicionar membros',
  })
  addUser(
    @Param('id') id: string,
    @Body() dto: AddUserToGroupDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.groupsService.addUser(id, dto, req.user.sub);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({
    summary: 'Remover usuário do grupo (apenas staff)',
    description: 'Apenas usuários com staffStatus podem remover membros',
  })
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.groupsService.removeUser(id, userId, req.user.sub);
  }

  @Get(':id/users')
  @ApiOperation({
    summary: 'Listar usuários do grupo com RLS',
    description:
      'Staff pode ver membros de qualquer grupo. Não-staff só pode ver membros de grupos que faz parte.',
  })
  getGroupUsers(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.groupsService.getGroupUsers(id, req.user.sub);
  }
}


