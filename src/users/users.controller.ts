import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { imageUpload } from '../common/upload.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Falta el token, es inválido o expiró' })
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Consultar mi perfil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.service.getProfile(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Actualizar mis datos personales' })
  @ApiResponse({ status: 409, description: 'Ese correo ya está registrado' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.sub, dto);
  }

  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('foto', imageUpload))
  @ApiOperation({ summary: 'Subir o cambiar mi foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { foto: { type: 'string', format: 'binary' } },
      required: ['foto'],
    },
  })
  uploadPhoto(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el campo foto');
    return this.service.updatePhoto(user.sub, file);
  }

  @Patch('profile/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'La contraseña actual es incorrecta' })
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(user.sub, dto);
  }
}