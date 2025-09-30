import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
}
