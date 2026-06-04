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
import { getRefId, getPaginationMetadata } from "../common/utils/db-helpers";

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

  async findAll(query: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const { search, status, page, limit } = query;
    const filter: QueryFilter<ProjectDocument> = { isDeleted: false };

    if (status) filter.status = status as ProjectStatus;
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const total = await this.projectModel.countDocuments(filter);
    const pagination = getPaginationMetadata(page, limit, total);

    const projects = await this.projectModel
      .find(filter)
      .populate("owner", "name email")
      .populate("members", "name email")
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ createdAt: -1 });

    return {
      data: {
        projects,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: pagination.totalPages,
        },
      },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid project ID format");
    }

    const projects = await this.projectModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          status: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          owner: {
            _id: 1,
            name: 1,
            email: 1,
          },
          members: {
            $map: {
              input: "$members",
              as: "member",
              in: {
                _id: "$$member._id",
                name: "$$member.name",
                email: "$$member.email",
              },
            },
          },
        },
      },
    ]);

    const project = projects[0] as Project | undefined;
    if (!project) throw new NotFoundException("Project not found");

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
      getRefId(project.owner) !== user._id.toString() &&
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
      getRefId(project.owner) !== user._id.toString() &&
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
      getRefId(project.owner) !== user._id.toString() &&
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
      (m) => getRefId(m) === dto.userId,
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
      getRefId(project.owner) !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("Only the owner can remove members");
    }

    if (memberId === getRefId(project.owner)) {
      throw new BadRequestException("Cannot remove the project owner");
    }

    await this.projectModel.findByIdAndUpdate(id, {
      $pull: { members: new Types.ObjectId(memberId) }, // $pull removes from array
    });

    return { message: "Member removed successfully" };
  }

  // Dashboard statistics for a specific project
  async getStats(projectId: string) {
    const project = await this.projectModel.findOne({
      _id: projectId,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");

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
  async getDashboardStats() {
    const projectFilter: QueryFilter<ProjectDocument> = { isDeleted: false };

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
}
