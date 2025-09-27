import { Body, Controller, Get, Post, Res, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../common/jwt.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(body.email, body.password);
    res.cookie('sv_token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 8 });
    return { user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) { res.clearCookie('sv_token'); return { ok: true }; }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) { return { user: (req as any).user }; }
}
