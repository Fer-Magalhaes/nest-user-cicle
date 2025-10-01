import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  countUsers() {
    return this.prisma.user.count();
  }

  async createUser(params: {
    name: string;
    username: string;
    email: string;
    password: string;
    roleId: string;
  }) {
    const passwordHash = await bcrypt.hash(params.password, 10);
    return this.prisma.user.create({
      data: {
        name: params.name,
        username: params.username,
        email: params.email,
        passwordHash,
        roleId: params.roleId,
      },
      include: { role: true },
    });
  }

  async setRefreshToken(userId: string, refreshToken: string | null) {
    let refreshTokenHash: string | null = null;
    if (refreshToken) {
      refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.findById(userId);
    if (!user || !user.refreshTokenHash) return false;
    return bcrypt.compare(refreshToken, user.refreshTokenHash);
  }

  // ==================== CRUD METHODS ====================

  /**
   * Cria novo usuário (apenas staff pode criar)
   */
  async create(dto: CreateUserDto, requesterId: string) {
    // Verificar se requester tem staffStatus
    const requester = await this.findById(requesterId);
    if (!requester?.role.staffStatus) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem criar usuários',
      );
    }

    // Verificar se email já existe
    const existsEmail = await this.findByEmail(dto.email);
    if (existsEmail) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Verificar se username já existe
    const existsUsername = await this.findByUsername(dto.username);
    if (existsUsername) {
      throw new BadRequestException('Username já cadastrado');
    }

    // Verificar se role existe
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new NotFoundException('Role não encontrada');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
      },
      include: { role: true },
    });

    // Remove campos sensíveis
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Lista usuários com RLS (Row Level Security)
   * - Staff: vê todos os usuários
   * - Não-staff: vê apenas ele mesmo
   */
  async findAll(requesterId: string) {
    const requester = await this.findById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se tem staffStatus, retorna todos
    if (requester.role.staffStatus) {
      const users = await this.prisma.user.findMany({
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });
      return users.map((u) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, refreshTokenHash, ...safe } = u;
        return safe;
      });
    }

    // Se não tem staffStatus, retorna apenas ele mesmo
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...safeUser } = requester;
    return [safeUser];
  }

  /**
   * Busca usuário por ID com RLS
   * - Staff: pode ver qualquer usuário
   * - Não-staff: só pode ver ele mesmo
   */
  async findOne(id: string, requesterId: string) {
    const requester = await this.findById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se não tem staffStatus, só pode ver ele mesmo
    if (!requester.role.staffStatus && requester.id !== id) {
      throw new ForbiddenException('Você não tem permissão para ver este usuário');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Atualiza usuário com RLS
   * - Staff: pode atualizar qualquer usuário
   * - Não-staff: só pode atualizar ele mesmo
   */
  async update(id: string, dto: UpdateUserDto, requesterId: string) {
    const requester = await this.findById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se não tem staffStatus, só pode editar ele mesmo
    if (!requester.role.staffStatus && requester.id !== id) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este usuário',
      );
    }

    // Validações
    if (dto.email && dto.email !== user.email) {
      const existsEmail = await this.findByEmail(dto.email);
      if (existsEmail) {
        throw new BadRequestException('Email já cadastrado');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const existsUsername = await this.findByUsername(dto.username);
      if (existsUsername) {
        throw new BadRequestException('Username já cadastrado');
      }
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new NotFoundException('Role não encontrada');
      }
    }

    // Preparar dados para atualização
    const updateData: {
      name?: string;
      username?: string;
      email?: string;
      roleId?: string;
      passwordHash?: string;
    } = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.username) updateData.username = dto.username;
    if (dto.email) updateData.email = dto.email;
    if (dto.roleId) updateData.roleId = dto.roleId;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  /**
   * Remove usuário (apenas staff pode remover)
   */
  async remove(id: string, requesterId: string) {
    const requester = await this.findById(requesterId);
    if (!requester?.role.staffStatus) {
      throw new ForbiddenException(
        'Apenas usuários com staff status podem remover usuários',
      );
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Não permite remover a si mesmo
    if (requester.id === id) {
      throw new BadRequestException('Você não pode remover a si mesmo');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      message: `Usuário "${user.name}" removido com sucesso`,
    };
  }
}
