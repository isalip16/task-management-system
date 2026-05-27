import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, QueryFilter } from "mongoose";
import * as bcrypt from "bcryptjs";
import { User, UserDocument, UserRole } from "./schemas/user.schema";

export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(query: { search?: string; page?: string; limit?: string }) {
    const { search, page = "1", limit = "10" } = query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: QueryFilter<UserDocument> = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // countDocuments for the total (for pagination metadata)
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });
    if (!user) throw new NotFoundException("User not found");
    return { data: user };
  }

  async update(id: string, dto: UpdateUserDto, requestingUser: UserDocument) {
    // Only the user themselves or an admin can update a profile
    if (
      requestingUser._id.toString() !== id &&
      requestingUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("You can only update your own profile");
    }

    if (dto.email) {
      const existing = await this.userModel.findOne({
        email: dto.email,
        _id: { $ne: id }, // $ne = "not equal" — exclude the current user from this check
        isDeleted: false,
      });
      if (existing) throw new ConflictException("Email already in use");
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.userModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: dto },
      { new: true }, // "new: true" returns the updated document, not the old one
    );

    if (!user) throw new NotFoundException("User not found");
    return { message: "Profile updated", data: user };
  }

  // Soft delete: mark isDeleted = true instead of removing from DB
  async remove(id: string, requestingUser: UserDocument) {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can delete users");
    }

    const user = await this.userModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, isActive: false } },
      { new: true },
    );

    if (!user) throw new NotFoundException("User not found");
    return { message: "User deleted successfully" };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      isDeleted: false,
    });
    if (!user) throw new NotFoundException("User not found");
    return { data: user };
  }
}
