import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../../users/schemas/user.schema";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = User>(err: unknown, user: TUser | null | false): TUser {
    if (err || !user) {
      throw (
        (err instanceof Error ? err : null) ||
        new UnauthorizedException("Access token is missing or invalid")
      );
    }
    return user;
  }
}
