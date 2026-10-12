import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { AdminUsersController } from './admin-users.controller.js';

@Module({
  imports: [AuthModule], // AuthModule exporta UsersRepository
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService],
})
export class UsersModule {}
