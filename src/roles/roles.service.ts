import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { MigrateRoleDto } from './dto/migrate-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (exists) {
      throw new ConflictException(`Role com nome "${dto.name}" já existe`);
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDeletable: true,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role com ID "${id}" não encontrada`);
    }

    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);

    // Se tentar alterar o nome, verificar duplicidade
    if (dto.name && dto.name !== role.name) {
      const exists = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });
      if (exists) {
        throw new ConflictException(`Role com nome "${dto.name}" já existe`);
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    // Verificar se é deletável
    if (!role.isDeletable) {
      throw new BadRequestException(
        `Role "${role.name}" não pode ser deletada (protegida pelo sistema)`,
      );
    }

    // Verificar se tem usuários
    const userCount = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ConflictException(
        `Não é possível deletar a role "${role.name}" pois ela possui ${userCount} usuário(s) associado(s). Use o endpoint /roles/migrate para migrar os usuários.`,
      );
    }

    await this.prisma.role.delete({ where: { id } });

    return { message: `Role "${role.name}" deletada com sucesso` };
  }

  async migrate(dto: MigrateRoleDto) {
    // Validar roles
    const fromRole = await this.findOne(dto.from);
    const toRole = await this.findOne(dto.to);

    if (dto.from === dto.to) {
      throw new BadRequestException(
        'As roles de origem e destino não podem ser iguais',
      );
    }

    // Contar usuários para migrar
    const userCount = await this.prisma.user.count({
      where: { roleId: dto.from },
    });

    if (userCount === 0) {
      throw new BadRequestException(
        `A role "${fromRole.name}" não possui usuários para migrar`,
      );
    }

    // Migrar todos os usuários
    const result = await this.prisma.user.updateMany({
      where: { roleId: dto.from },
      data: { roleId: dto.to },
    });

    return {
      message: `${result.count} usuário(s) migrado(s) de "${fromRole.name}" para "${toRole.name}"`,
      from: fromRole.name,
      to: toRole.name,
      usersMigrated: result.count,
    };
  }
}
