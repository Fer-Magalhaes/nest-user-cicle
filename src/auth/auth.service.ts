import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, SafeUser } from './types/auth-response.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private prisma: PrismaService,
  ) {}

  private toSafe(u: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: { id: string; name: string; [key: string]: unknown };
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
    refreshTokenHash: string | null;
    [key: string]: unknown;
  }): SafeUser {
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: {
        id: u.role.id,
        name: u.role.name,
      },
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  private signAccess(payload: { sub: string; role: string; email: string }) {
    return this.jwt.signAsync(payload, {
      secret: this.cfg.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.cfg.get<string>('JWT_ACCESS_EXPIRES') ?? '15m',
    });
  }

  private signRefresh(payload: { sub: string; email: string; role: string }) {
    return this.jwt.signAsync(payload, {
      secret: this.cfg.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.cfg.get<string>('JWT_REFRESH_EXPIRES') ?? '7d',
    });
  }

  /**
   * Regras de cadastro:
   * - Se NÃO existe nenhum usuário no sistema, o primeiro cadastro é permitido e será MASTER.
   * - Senão, apenas usuários com role MASTER podem registrar (controlado pelo guard no controller).
   */
  async register(
    dto: RegisterDto,
    requesterRoleName?: string,
  ): Promise<SafeUser> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords não conferem');
    }

    const existsEmail = await this.users.findByEmail(dto.email);
    if (existsEmail) throw new BadRequestException('Email já existe');

    const existsUsername = await this.users.findByUsername(dto.username);
    if (existsUsername) throw new BadRequestException('Username já existe');

    const count = await this.users.countUsers();

    // Se é o primeiro usuário, busca role MASTER
    let targetRole;
    if (count === 0) {
      targetRole = await this.prisma.role.findUnique({
        where: { name: 'MASTER' },
      });
      if (!targetRole) {
        throw new BadRequestException(
          'Role MASTER não encontrada. Execute o seed primeiro.',
        );
      }
    } else {
      // Apenas MASTER pode registrar novos usuários
      if (requesterRoleName !== 'MASTER') {
        throw new ForbiddenException(
          'Somente MASTER pode registrar novos usuários',
        );
      }
      // Por padrão, novos usuários são USER
      targetRole = await this.prisma.role.findUnique({
        where: { name: 'USER' },
      });
      if (!targetRole) {
        throw new BadRequestException('Role USER não encontrada');
      }
    }

    const user = await this.users.createUser({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      password: dto.password,
      roleId: targetRole.id,
    });
    return this.toSafe(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.findUserByIdentifier(dto.identifier);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.validatePassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return await this.generateAuthResponse(user);
  }

    /**
     * Busca usuário por identifier (email ou username)
     * @param identifier Email ou username do usuário
     * @returns Usuário encontrado ou null
     */
    private async findUserByIdentifier(identifier: string): Promise<{
      id: string;
      name: string;
      username: string;
      email: string;
      role: { id: string; name: string; [key: string]: unknown };
      createdAt: Date;
      updatedAt: Date;
      passwordHash: string;
      refreshTokenHash: string | null;
      [key: string]: unknown;
    } | null> {
      const isEmail = this.isValidEmail(identifier);
      
      if (isEmail) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        return await this.users.findByEmail(identifier);
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return await this.users.findByUsername(identifier);
    }

  /**
   * Valida se a string é um email válido
   * @param email String para validar
   * @returns true se for email válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida senha do usuário
   * @param password Senha fornecida
   * @param hashedPassword Hash da senha armazenada
   * @returns true se senha for válida
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Gera resposta de autenticação com tokens
   * @param user Usuário autenticado
   * @returns Resposta com tokens e dados do usuário
   */
  private async generateAuthResponse(user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: { id: string; name: string; [key: string]: unknown };
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
    refreshTokenHash: string | null;
    [key: string]: unknown;
  }): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      role: user.role.name,
      email: user.email,
    };

    const accessToken = await this.signAccess(payload);
    const refreshToken = await this.signRefresh(payload);

    await this.users.setRefreshToken(user.id, refreshToken);

    return {
      user: this.toSafe(user),
      role: user.role.name,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.users.setRefreshToken(userId, null);
    return { message: 'Logout efetuado' };
  }

  async refresh(
    userId: string,
    providedToken: string,
  ): Promise<{ accessToken: string }> {
    const isValid = await this.users.validateRefreshToken(
      userId,
      providedToken,
    );
    if (!isValid) throw new UnauthorizedException('Refresh token inválido');
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const accessToken = await this.signAccess({
      sub: user.id,
      role: user.role.name,
      email: user.email,
    });
    return { accessToken };
  }
}
