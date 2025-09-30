import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /**
   * Registro:
   * - Primeiro usuário do sistema: livre e vira MASTER
   * - Demais: apenas MASTER pode registrar (AccessToken necessário)
   */
  @Post('register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: { user?: { sub: string; role: string } },
  ) {
    const requesterRoleName = req.user?.role; // MASTER exigido pelo guard
    const user = await this.auth.register(dto, requesterRoleName);
    return { user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    // estratégia de refresh também pode ser usada com guard 'jwt-refresh'
    // aqui validamos via serviço para simplificar a DX de Postman/Swagger
    const payload = this.tryDecodeRefresh(dto.refreshToken);
    const result = await this.auth.refresh(payload.sub, dto.refreshToken);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: { user: { sub: string; role: string } }) {
    await this.auth.logout(req.user.sub);
    return { message: 'ok' };
  }

  // utilitário simples para extrair o sub (sem depender de guard no /refresh)
  private tryDecodeRefresh(token: string): { sub: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Token inválido');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!payload?.sub) throw new Error('Payload inválido');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return { sub: payload.sub };
  }

  // rota de teste
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER')
  @Get('me/master-check')
  masterCheck() {
    return { ok: true };
  }
}
