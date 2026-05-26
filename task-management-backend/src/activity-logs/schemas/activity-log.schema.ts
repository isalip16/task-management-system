import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { TaskStatus } from "../../tasks/schemas/task.schema";

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, ref: "Task", required: true })
  task: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Project", required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  changedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: [...Object.values(TaskStatus), null],
    default: null,
  })
  fromStatus: TaskStatus | null;

  @Prop({ type: String, enum: TaskStatus, required: true })
  toStatus: TaskStatus;

  @Prop({ required: true })
  action: string;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
ActivityLogSchema.index({ project: 1, createdAt: -1 });
