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
import { ProjectsService } from "./projects.service";
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
} from "./dto/project.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserDocument } from "../users/schemas/user.schema";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // GET /projects/dashboard — global stats across all user's projects
  @Get("dashboard")
  getDashboardStats(@CurrentUser() user: UserDocument) {
    return this.projectsService.getDashboardStats(user);
  }

  // POST /projects
  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: UserDocument) {
    return this.projectsService.create(dto, user);
  }

  // GET /projects?search=...&status=...&page=1&limit=10
  @Get()
  findAll(
    @Query()
    query: { search?: string; status?: string; page?: string; limit?: string },
    @CurrentUser() user: UserDocument,
  ) {
    return this.projectsService.findAll(query, user);
  }

  // GET /projects/:id
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.projectsService.findOne(id, user);
  }

  // GET /projects/:id/stats
  @Get(":id/stats")
  getStats(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.projectsService.getStats(id, user);
  }

  // PATCH /projects/:id
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  // DELETE /projects/:id
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.projectsService.remove(id, user);
  }

  // POST /projects/:id/members
  @Post(":id/members")
  addMember(
    @Param("id") id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.projectsService.addMember(id, dto, user);
  }

  // DELETE /projects/:id/members/:memberId
  @Delete(":id/members/:memberId")
  removeMember(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.projectsService.removeMember(id, memberId, user);
  }
}
