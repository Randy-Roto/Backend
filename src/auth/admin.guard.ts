import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.rol !== 'admin') {
      throw new ForbiddenException('Solo un administrador puede hacer esto');
    }
    return true;
  }
}