import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService, UpdateUserDto } from "./users.service";
import { JwtAuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole, UserDocument } from "./schemas/user.schema";

// @UseGuards on the controller level applies to ALL routes inside
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/profile — get the currently logged-in user's profile
  @Get("profile")
  getProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.getProfile(user._id.toString());
  }

  // GET /users — only admins can list all users
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: { search?: string; page?: string; limit?: string }) {
    return this.usersService.findAll(query);
  }

  // GET /users/:id
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  // PATCH /users/:id
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.usersService.update(id, dto, user);
  }

  // DELETE /users/:id — admin only
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.usersService.remove(id, user);
  }
}
