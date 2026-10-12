import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ReportesModule } from './reportes/reportes.module.js';
import { SitesModule } from './sites/sites.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    AuthModule,
    CategoriesModule,
    ReportesModule,
    SitesModule,
    UsersModule,
    NotificationsModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}