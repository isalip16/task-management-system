import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { Task, TaskSchema } from "./schemas/task.schema";
import { Project, ProjectSchema } from "../projects/schemas/project.schema";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    ActivityLogsModule, // Import so we can inject ActivityLogsService
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
