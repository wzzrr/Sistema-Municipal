var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
let InternalGuard = class InternalGuard {
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const got = req.headers['x-internal-token'];
        const expected = process.env.INTERNAL_API_TOKEN || '';
        if (got && typeof got === 'string' && got === expected)
            return true;
        throw new UnauthorizedException('Internal token missing/invalid');
    }
};
InternalGuard = __decorate([
    Injectable()
], InternalGuard);
export { InternalGuard };
