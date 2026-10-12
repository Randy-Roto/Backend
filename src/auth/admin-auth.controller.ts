import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterAdminDto } from './dto/register-admin.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('admin / auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un administrador con código de invitación' })
  @ApiResponse({ status: 201, description: 'Administrador creado' })
  @ApiResponse({ status: 403, description: 'Código de invitación inválido' })
  @ApiResponse({ status: 409, description: 'Correo ya registrado' })
  register(@Body() dto: RegisterAdminDto) {
    return this.service.registerAdmin(dto.nombre!, dto.correo!, dto.password!, dto.codigo_invitacion!);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión como administrador' })
  @ApiResponse({ status: 200, description: 'accessToken y refreshToken' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o la cuenta no es admin' })
  login(@Body() dto: LoginDto) {
    return this.service.loginAdmin(dto.correo!, dto.password!);
  }
}