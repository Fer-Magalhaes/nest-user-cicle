import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica se usuário tem staffStatus
   */
  private async checkStaffStatus(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    return user?.role.staffStatus ?? false;
  }

  /**
   * Verifica se usuário pertence ao grupo
   */
  private async isUserInGroup(
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const userGroup = await this.prisma.userGroup.findFirst({
      where: { userId, groupId },
    });
    return !!userGroup;
  }

  /**
   * Cria novo grupo (apenas staff)
   */
  async create(dto: CreateGroupDto, requesterId: string) {
    const isStaff = await this.checkStaffStatus(requesterId);
    if (!isStaff) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem criar grupos',
      );
    }

    // Verificar se nome já existe
    const exists = await this.prisma.group.findUnique({
      where: { name: dto.name },
    });
    if (exists) {
      throw new BadRequestException('Já existe um grupo com este nome');
    }

    return this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * Lista grupos com RLS
   * - Staff: vê todos os grupos
   * - Não-staff: vê apenas grupos que faz parte
   */
  async findAll(requesterId: string) {
    const isStaff = await this.checkStaffStatus(requesterId);

    if (isStaff) {
      // Staff vê todos os grupos
      return this.prisma.group.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Não-staff vê apenas grupos que participa
    const userGroups = await this.prisma.userGroup.findMany({
      where: { userId: requesterId },
      include: {
        group: {
          include: {
            _count: {
              select: { users: true },
            },
          },
        },
      },
    });

    return userGroups.map((ug) => ug.group);
  }

  /**
   * Busca grupo por ID com RLS
   * - Staff: pode ver qualquer grupo
   * - Não-staff: só pode ver grupos que faz parte
   */
  async findOne(id: string, requesterId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const isStaff = await this.checkStaffStatus(requesterId);
    if (!isStaff) {
      // Não-staff só pode ver se faz parte do grupo
      const isMember = await this.isUserInGroup(requesterId, id);
      if (!isMember) {
        throw new ForbiddenException(
          'Você não tem permissão para ver este grupo',
        );
      }
    }

    return group;
  }

  /**
   * Atualiza grupo (apenas staff)
   */
  async update(id: string, dto: UpdateGroupDto, requesterId: string) {
    const isStaff = await this.checkStaffStatus(requesterId);
    if (!isStaff) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem atualizar grupos',
      );
    }

    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // Verificar se nome já existe
    if (dto.name && dto.name !== group.name) {
      const exists = await this.prisma.group.findUnique({
        where: { name: dto.name },
      });
      if (exists) {
        throw new BadRequestException('Já existe um grupo com este nome');
      }
    }

    return this.prisma.group.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * Remove grupo (apenas staff)
   */
  async remove(id: string, requesterId: string) {
    const isStaff = await this.checkStaffStatus(requesterId);
    if (!isStaff) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem remover grupos',
      );
    }

    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    await this.prisma.group.delete({ where: { id } });

    return {
      message: `Grupo "${group.name}" removido com sucesso`,
    };
  }

  /**
   * Adiciona usuário ao grupo (apenas staff)
   */
  async addUser(
    groupId: string,
    dto: AddUserToGroupDto,
    requesterId: string,
  ) {
    const isStaff = await this.checkStaffStatus(requesterId);
    if (!isStaff) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem adicionar usuários a grupos',
      );
    }

    // Verificar se grupo existe
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se já está no grupo
    const exists = await this.prisma.userGroup.findFirst({
      where: { userId: dto.userId, groupId },
    });
    if (exists) {
      throw new BadRequestException('Usuário já está neste grupo');
    }

    await this.prisma.userGroup.create({
      data: {
        userId: dto.userId,
        groupId,
      },
    });

    return {
      message: `Usuário "${user.name}" adicionado ao grupo "${group.name}"`,
    };
  }

  /**
   * Remove usuário do grupo (apenas staff)
   */
  async removeUser(groupId: string, userId: string, requesterId: string) {
    const isStaff = await this.checkStaffStatus(requesterId);
    if (!isStaff) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem remover usuários de grupos',
      );
    }

    // Verificar se grupo existe
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se está no grupo
    const userGroup = await this.prisma.userGroup.findFirst({
      where: { userId, groupId },
    });
    if (!userGroup) {
      throw new BadRequestException('Usuário não está neste grupo');
    }

    await this.prisma.userGroup.delete({ where: { id: userGroup.id } });

    return {
      message: `Usuário "${user.name}" removido do grupo "${group.name}"`,
    };
  }

  /**
   * Lista usuários de um grupo com RLS
   */
  async getGroupUsers(groupId: string, requesterId: string) {
    const isStaff = await this.checkStaffStatus(requesterId);

    // Verificar se grupo existe
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    if (!isStaff) {
      // Não-staff só pode ver se faz parte do grupo
      const isMember = await this.isUserInGroup(requesterId, groupId);
      if (!isMember) {
        throw new ForbiddenException(
          'Você não tem permissão para ver os membros deste grupo',
        );
      }
    }

    const userGroups = await this.prisma.userGroup.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return userGroups.map((ug) => ({
      ...ug.user,
      joinedAt: ug.createdAt,
    }));
  }
}


