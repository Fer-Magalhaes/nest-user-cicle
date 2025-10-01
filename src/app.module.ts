import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RolesModule,
    GroupsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
