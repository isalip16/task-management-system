import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ActivityLog,
  ActivityLogDocument,
} from "./schemas/activity-log.schema";
import { getPaginationMetadata } from "../common/utils/db-helpers";
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
    const { page, limit } = query;
    const total = await this.activityLogModel.countDocuments({
      project: new Types.ObjectId(projectId),
    });
    const pagination = getPaginationMetadata(page, limit || "20", total);

    const logs = await this.activityLogModel
      .find({ project: new Types.ObjectId(projectId) })
      .populate("changedBy", "name email") // join User data: only return name and email
      .populate("task", "title") // join Task data: only return title
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      data: {
        logs,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: pagination.totalPages,
        },
      },
    };
  }
}
