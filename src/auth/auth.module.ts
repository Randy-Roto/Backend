import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersRepository } from './users.repository.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, UsersRepository],
  exports: [UsersRepository],
})
export class AuthModule {}