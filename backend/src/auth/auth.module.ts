import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [PassportModule, JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret', signOptions: { expiresIn: '8h' } })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UsersService],
  exports: [UsersService],
})
export class AuthModule {}
