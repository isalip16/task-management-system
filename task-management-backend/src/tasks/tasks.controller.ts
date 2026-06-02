import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskQueryDto,
} from "./dto/task.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserDocument } from "../users/schemas/user.schema";

@Controller("tasks")
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  // POST /tasks
  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: UserDocument) {
    return this.tasksService.create(dto, user);
  }

  // GET /tasks?status=TODO&search=bug&page=1
  @Get()
  findAll(@Query() query: TaskQueryDto, @CurrentUser() user: UserDocument) {
    return this.tasksService.findAll(query, user);
  }

  // GET /tasks/project/:projectId — all tasks for a specific project
  @Get("project/:projectId")
  findByProject(
    @Param("projectId") projectId: string,
    @Query() query: TaskQueryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.tasksService.findByProject(projectId, query, user);
  }

  // GET /tasks/project/:projectId/logs — activity logs for a project
  @Get("project/:projectId/logs")
  getProjectLogs(
    @Param("projectId") projectId: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.activityLogsService.getProjectLogs(projectId, query);
  }

  // GET /tasks/:id
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.tasksService.findOne(id, user);
  }

  // PATCH /tasks/:id
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  // PATCH /tasks/:id/status — separate endpoint for status workflow
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.tasksService.updateStatus(id, dto, user);
  }

  // DELETE /tasks/:id
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.tasksService.remove(id, user);
  }
}
