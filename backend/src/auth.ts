import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { rows } from './db';
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
@Injectable()
export class Auth implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : req.cookies?.session;
    if (!token) throw new UnauthorizedException('Please sign in');
    try {
      const claims = this.jwt.verify(token);
      const [user] = await rows('SELECT u.id,u.name,u.email,u.phone,u.role FROM users u JOIN sessions s ON s.userId=u.id WHERE u.id=? AND u.active=1 AND s.hash=? AND s.expiresAt>UTC_TIMESTAMP()', [claims.sub, digest(token)]);
      if (!user) throw new Error(); req.user = user; req.token = token; return true;
    } catch { throw new UnauthorizedException('Session expired. Please sign in again'); }
  }
}
@Injectable()
export class Admin implements CanActivate {
  canActivate(context: ExecutionContext) { if (context.switchToHttp().getRequest().user?.role !== 'ADMIN') throw new ForbiddenException('Admin only'); return true; }
}
