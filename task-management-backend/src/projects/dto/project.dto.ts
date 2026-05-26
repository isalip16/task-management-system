import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  MaxLength,
} from "class-validator";
import { ProjectStatus } from "../schemas/project.schema";

export class CreateProjectDto {
  @IsNotEmpty({ message: "Project name is required" })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class AddMemberDto {
  @IsMongoId({ message: "Invalid user ID format" })
  userId: string;
}
