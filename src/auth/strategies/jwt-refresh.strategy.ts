import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

function extractFromBody(req: Request): string | null {
  if (req.body && typeof req.body === 'object' && 'refreshToken' in req.body) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return req.body.refreshToken as string;
  }
  return null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(cfg: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromExtractors([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        ExtractJwt.fromAuthHeaderAsBearerToken(), // opcional
        extractFromBody,
      ]),
      secretOrKey: cfg.get<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: { sub: string; email: string; role: string },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const token =
      extractFromBody(req) ?? ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException('Refresh token ausente');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { ...payload, refreshToken: token };
  }
}
