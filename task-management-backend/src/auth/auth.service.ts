import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { User, UserDocument } from "../users/schemas/user.schema";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({
      email: dto.email,
      isDeleted: false,
    });
    if (existing) throw new ConflictException("Email already in use");

    // bcrypt salt rounds = 10: each increase doubles the computation time
    // 10 is the industry standard balance of security vs performance
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
    });

    return {
      message: "Account created successfully",
      data: {
        user: this.stripPassword(user),
        accessToken: this.sign(user),
      },
    };
  }

  async login(dto: LoginDto) {
    // Must explicitly select password because we set select: false in schema
    const user = await this.userModel
      .findOne({ email: dto.email, isDeleted: false, isActive: true })
      .select("+password");

    // Intentionally vague message — don't tell attackers whether the email exists
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches)
      throw new UnauthorizedException("Invalid email or password");

    return {
      message: "Login successful",
      data: {
        user: this.stripPassword(user),
        accessToken: this.sign(user),
      },
    };
  }

  private sign(user: UserDocument): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }

  private stripPassword(user: UserDocument): Record<string, unknown> {
    const obj = user.toObject() as Record<string, unknown>;
    delete obj["password"];
    return obj;
  }
}
