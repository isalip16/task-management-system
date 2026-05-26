import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ActivityLog,
  ActivityLogDocument,
} from "./schemas/activity-log.schema";
import { TaskStatus } from "../tasks/schemas/task.schema";

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLogDocument>,
  ) {}

  // Called whenever a task's status changes
  async logStatusChange(params: {
    taskId: string;
    projectId: string;
    userId: string;
    fromStatus: TaskStatus | null;
    toStatus: TaskStatus;
    taskTitle: string;
  }) {
    const { taskId, projectId, userId, fromStatus, toStatus, taskTitle } =
      params;

    const action = fromStatus
      ? `Changed status of "${taskTitle}" from ${fromStatus} to ${toStatus}`
      : `Created task "${taskTitle}" with status ${toStatus}`;

    return this.activityLogModel.create({
      task: new Types.ObjectId(taskId),
      project: new Types.ObjectId(projectId),
      changedBy: new Types.ObjectId(userId),
      fromStatus,
      toStatus,
      action,
    });
  }

  // Get paginated logs for a specific project
  async getProjectLogs(
    projectId: string,
    query: { page?: string; limit?: string },
  ) {
    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20")));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.activityLogModel
        .find({ project: new Types.ObjectId(projectId) })
        .populate("changedBy", "name email") // join User data: only return name and email
        .populate("task", "title") // join Task data: only return title
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.activityLogModel.countDocuments({
        project: new Types.ObjectId(projectId),
      }),
    ]);

    return {
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}
