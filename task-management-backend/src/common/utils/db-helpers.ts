import { Types } from "mongoose";
import { User, UserDocument } from "../../users/schemas/user.schema";

export function getRefId(ref: Types.ObjectId | User): string {
  if (ref instanceof Types.ObjectId) {
    return ref.toHexString();
  }
  const id = (ref as UserDocument)?._id;
  if (id instanceof Types.ObjectId) {
    return id.toHexString();
  }
  return String(id || "");
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
}

export function getPaginationMetadata(
  page: string | undefined,
  limit: string | undefined,
  total: number,
): PaginationResult {
  const pageNum = Math.max(1, parseInt(page || "1"));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit || "10")));
  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}
