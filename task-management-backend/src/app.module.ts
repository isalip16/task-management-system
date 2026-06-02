import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProjectsModule } from "./projects/projects.module";
import { TasksModule } from "./tasks/tasks.module";
import { ActivityLogsModule } from "./activity-logs/activity-logs.module";
import { JwtAuthGuard } from "./common/guards/auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("MONGODB_URI"),
      }),
    }),
    AuthModule,
    UsersModule,
    ActivityLogsModule,
    ProjectsModule,
    TasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
