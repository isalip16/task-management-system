import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, QueryFilter } from "mongoose";
import { Task, TaskDocument, TaskStatus } from "./schemas/task.schema";
import { Project, ProjectDocument } from "../projects/schemas/project.schema";
import { User, UserDocument, UserRole } from "../users/schemas/user.schema";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskQueryDto,
} from "./dto/task.dto";

// Define which status transitions are allowed.
// TODO can go to IN_PROGRESS. IN_PROGRESS can go to DONE or back to TODO. DONE can go back to IN_PROGRESS.
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
  [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
};

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateTaskDto, creator: UserDocument) {
    // Verify the project exists and the user has access
    const project = await this.projectModel.findOne({
      _id: dto.projectId,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");

    this.checkProjectAccess(project, creator);

    const task = await this.taskModel.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      project: new Types.ObjectId(dto.projectId),
      createdBy: creator._id,
      assignedTo: dto.assignedTo ? new Types.ObjectId(dto.assignedTo) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    // Log the task creation as an activity
    await this.activityLogsService.logStatusChange({
      taskId: task._id.toString(),
      projectId: dto.projectId,
      userId: creator._id.toString(),
      fromStatus: null, // null because this is a new task
      toStatus: TaskStatus.TODO,
      taskTitle: task.title,
    });

    const populated = await task.populate([
      { path: "createdBy", select: "name email" },
      { path: "assignedTo", select: "name email" },
    ]);

    return { message: "Task created successfully", data: populated };
  }

  async findAll(query: TaskQueryDto, user: UserDocument) {
    const {
      status,
      priority,
      assignedTo,
      search,
      page = "1",
      limit = "10",
    } = query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: QueryFilter<TaskDocument> = { isDeleted: false };

    // Members can only see tasks in projects they're part of
    if (user.role !== UserRole.ADMIN) {
      const userProjects = await this.projectModel
        .find({
          $or: [{ owner: user._id }, { members: user._id }],
          isDeleted: false,
        })
        .select("_id");
      filter.project = { $in: userProjects.map((p) => p._id) };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = new Types.ObjectId(assignedTo);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .populate("project", "name")
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      data: {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  async findByProject(
    projectId: string,
    query: TaskQueryDto,
    user: UserDocument,
  ) {
    const project = await this.projectModel.findOne({
      _id: projectId,
      isDeleted: false,
    });
    if (!project) throw new NotFoundException("Project not found");
    this.checkProjectAccess(project, user);

    const {
      status,
      priority,
      assignedTo,
      search,
      page = "1",
      limit = "10",
    } = query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: QueryFilter<TaskDocument> = {
      project: new Types.ObjectId(projectId),
      isDeleted: false,
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = new Types.ObjectId(assignedTo);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      data: {
        tasks,
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
    const task = await this.taskModel
      .findOne({ _id: id, isDeleted: false })
      .populate("project", "name members owner")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!task) throw new NotFoundException("Task not found");

    const project = task.project as unknown as ProjectDocument;
    this.checkProjectAccess(project, user);

    return { data: task };
  }

  async update(id: string, dto: UpdateTaskDto, user: UserDocument) {
    const task = await this.taskModel
      .findOne({ _id: id, isDeleted: false })
      .populate("project");

    if (!task) throw new NotFoundException("Task not found");
    this.checkProjectAccess(task.project as unknown as ProjectDocument, user);

    const updated = await this.taskModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    return { message: "Task updated", data: updated };
  }

  // Status change is a SEPARATE endpoint because it enforces the workflow
  async updateStatus(id: string, dto: UpdateTaskStatusDto, user: UserDocument) {
    const task = await this.taskModel
      .findOne({ _id: id, isDeleted: false })
      .populate("project");

    if (!task) throw new NotFoundException("Task not found");
    this.checkProjectAccess(task.project as unknown as ProjectDocument, user);

    const { status: newStatus } = dto;
    const currentStatus = task.status;

    // Enforce the status workflow — only allow valid transitions
    if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. ` +
          `Valid transitions: ${VALID_TRANSITIONS[currentStatus].join(", ")}`,
      );
    }

    task.status = newStatus;
    await task.save();

    // Log every status change — this is the core of the activity log feature
    await this.activityLogsService.logStatusChange({
      taskId: task._id.toString(),
      projectId: (task.project as unknown as ProjectDocument)._id.toHexString(),
      userId: user._id.toString(),
      fromStatus: currentStatus,
      toStatus: newStatus,
      taskTitle: task.title,
    });

    return { message: `Task moved to ${newStatus}`, data: task };
  }

  async remove(id: string, user: UserDocument) {
    const task = await this.taskModel
      .findOne({ _id: id, isDeleted: false })
      .populate("project");

    if (!task) throw new NotFoundException("Task not found");
    this.checkProjectAccess(task.project as unknown as ProjectDocument, user);

    await this.taskModel.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    return { message: "Task deleted successfully" };
  }

  private checkProjectAccess(project: ProjectDocument, user: UserDocument) {
    if (user.role === UserRole.ADMIN) return;

    const isOwner = this.getRefId(project.owner) === user._id.toString();
    const isMember = project.members?.some(
      (m) => this.getRefId(m) === user._id.toString(),
    );

    if (!isOwner && !isMember) {
      throw new ForbiddenException("You do not have access to this project");
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
