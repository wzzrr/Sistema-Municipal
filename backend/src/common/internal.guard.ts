// src/common/internal.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const got = req.headers['x-internal-token'];
    const expected = process.env.INTERNAL_API_TOKEN || '';
    if (got && typeof got === 'string' && got === expected) return true;
    throw new UnauthorizedException('Internal token missing/invalid');
  }
}
