import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { Project, ProjectSchema } from "./schemas/project.schema";
import { Task, TaskSchema } from "../tasks/schemas/task.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema }, // Needed for stats queries
      { name: User.name, schema: UserSchema }, // Needed for member validation
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, MongooseModule],
})
export class ProjectsModule {}
