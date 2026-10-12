import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Correo ya registrado' })
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto.nombre!, dto.correo!, dto.password!);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Entrar: correo + password → tokens' })
  @ApiResponse({ status: 200, description: 'accessToken (15 min) y refreshToken (7 días)' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.correo!, dto.password!);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Access token nuevo a partir del refresh token' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto.refreshToken!);
  }
}