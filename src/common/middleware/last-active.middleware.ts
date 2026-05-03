import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LastActiveMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const auth = req.headers['authorization'];
      if (auth?.startsWith('Bearer ')) {
        const token = auth.slice(7);
        const payload = this.jwtService.verify<{ sub: string }>(token, {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        });
        if (payload?.sub) {
          // Fire-and-forget — don't block the request
          this.usersService.touchLastActive(payload.sub).catch(() => null);
        }
      }
    } catch {
      // Invalid token — let the auth guard handle it
    }
    next();
  }
}
