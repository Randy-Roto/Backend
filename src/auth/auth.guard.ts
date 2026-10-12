import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verify } from './jwt.js';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token');
    }
    const payload = verify(header.slice('Bearer '.length));
    if (!payload || payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido, expirado o no es de acceso');
    }
    req.user = payload;
    return true;
  }
}