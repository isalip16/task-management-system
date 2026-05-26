import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, QueryFilter } from "mongoose";
import {
  Project,
  ProjectDocument,
  ProjectStatus,
} from "./schemas/project.schema";
import { Task, TaskDocument, TaskStatus } from "../tasks/schemas/task.schema";
import { User, UserDocument, UserRole } from "../users/schemas/user.schema";
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
} from "./dto/project.dto";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateProjectDto, owner: UserDocument) {
    const project = await this.projectModel.create({
      ...dto,
      owner: owner._id,
      members: [owner._id], // Owner is automatically a member
    });

    return {
      message: "Project created successfully",
      data: await project.populate("owner", "name email"),
    };
  }

  async findAll(
    query: { search?: string; status?: string; page?: string; limit?: string },
    user: UserDocument,
  ) {
    const { search, status, page = "1", limit = "10" } = query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: QueryFilter<ProjectDocument> = { isDeleted: false };

    // Admins see all projects; members only see projects they're part of
    if (user.role !== UserRole.ADMIN) {
      filter.$or = [
        { owner: user._id },
        { members: user._id }, // $elemMatch not needed for simple equality check in array
      ];
    }

    if (status) filter.status = status as ProjectStatus;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [projects, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .populate("owner", "name email")
        .populate("members", "name email")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      this.projectModel.countDocuments(filter),
    ]);

    return {
      data: {
        projects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  async findOne(id: string, user: UserDocument) {
    const project = await this.projectModel
      .findOne({ _id: id, isDeleted: false })
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) throw new NotFoundException("Project not found");
    this.checkAccess(project, user);

    return { data: project };
  }

  async update(id: string, dto: UpdateProjectDto, user: UserDocument) {
    const project = await this.projectModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");

    // Only owner or admin can update a project
    if (
      this.getRefId(project.owner) !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Only the project owner can update this project",
      );
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate("owner", "name email")
      .populate("members", "name email");

    return { message: "Project updated", data: updated };
  }

  async remove(id: string, user: UserDocument) {
    const project = await this.projectModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");

    if (
      this.getRefId(project.owner) !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Only the project owner can delete this project",
      );
    }

    // Soft delete the project AND all its tasks
    await Promise.all([
      this.projectModel.findByIdAndUpdate(id, { $set: { isDeleted: true } }),
      this.taskModel.updateMany(
        { project: new Types.ObjectId(id) },
        { $set: { isDeleted: true } },
      ),
    ]);

    return { message: "Project and all its tasks deleted successfully" };
  }

  async addMember(id: string, dto: AddMemberDto, user: UserDocument) {
    const project = await this.projectModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");

    if (
      this.getRefId(project.owner) !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("Only the owner can add members");
    }

    const memberUser = await this.userModel.findOne({
      _id: dto.userId,
      isDeleted: false,
    });
    if (!memberUser) throw new NotFoundException("User to add not found");

    const memberId = new Types.ObjectId(dto.userId);
    const alreadyMember = project.members.some(
      (m) => this.getRefId(m) === dto.userId,
    );
    if (alreadyMember) {
      throw new BadRequestException("User is already a member of this project");
    }

    await this.projectModel.findByIdAndUpdate(id, {
      $addToSet: { members: memberId }, // $addToSet prevents duplicates
    });

    return { message: "Member added successfully" };
  }

  async removeMember(id: string, memberId: string, user: UserDocument) {
    const project = await this.projectModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");

    if (
      this.getRefId(project.owner) !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("Only the owner can remove members");
    }

    if (memberId === this.getRefId(project.owner)) {
      throw new BadRequestException("Cannot remove the project owner");
    }

    await this.projectModel.findByIdAndUpdate(id, {
      $pull: { members: new Types.ObjectId(memberId) }, // $pull removes from array
    });

    return { message: "Member removed successfully" };
  }

  // Dashboard statistics for a specific project
  async getStats(projectId: string, user: UserDocument) {
    const project = await this.projectModel.findOne({
      _id: projectId,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");
    this.checkAccess(project, user);

    // MongoDB aggregation: group tasks by status and count them
    const taskStats = await this.taskModel.aggregate([
      { $match: { project: new Types.ObjectId(projectId), isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats: Record<TaskStatus | "total", number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      total: 0,
    };
    taskStats.forEach((stat) => {
      const s = stat as { _id: TaskStatus; count: number };
      stats[s._id] = s.count;
      stats.total += s.count;
    });

    return { data: stats };
  }

  // Dashboard stats across ALL projects the user is part of
  async getDashboardStats(user: UserDocument) {
    const projectFilter: QueryFilter<ProjectDocument> = { isDeleted: false };
    if (user.role !== UserRole.ADMIN) {
      projectFilter.$or = [{ owner: user._id }, { members: user._id }];
    }

    const userProjects = await this.projectModel
      .find(projectFilter)
      .select("_id");
    const projectIds = userProjects.map((p) => p._id);

    const [totalProjects, taskStats] = await Promise.all([
      this.projectModel.countDocuments(projectFilter),
      this.taskModel.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            isDeleted: false,
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]) as Promise<{ _id: TaskStatus; count: number }[]>,
    ]);

    const tasks: Record<TaskStatus | "total", number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      total: 0,
    };
    taskStats.forEach(({ _id, count }) => {
      tasks[_id] = count;
      tasks.total += count;
    });

    return {
      data: {
        totalProjects,
        tasks,
      },
    };
  }

  // Helper: check if a user has access to a project (is member or admin)
  private checkAccess(project: ProjectDocument, user: UserDocument) {
    if (user.role === UserRole.ADMIN) return;
    const hasAccess =
      this.getRefId(project.owner) === user._id.toString() ||
      project.members.some((m) => this.getRefId(m) === user._id.toString());
    if (!hasAccess) {
      throw new ForbiddenException("You are not a member of this project");
    }
  }

  private getRefId(ref: Types.ObjectId | User): string {
    if (ref instanceof Types.ObjectId) {
      return ref.toHexString();
    }
    const id = (ref as UserDocument)._id;
    if (id instanceof Types.ObjectId) {
      return id.toHexString();
    }
    return String(id || "");
  }
}
