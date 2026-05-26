import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "../../users/schemas/user.schema";

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: String, enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  owner: Types.ObjectId | User;

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  members: (Types.ObjectId | User)[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
