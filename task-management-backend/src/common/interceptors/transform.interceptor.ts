import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

type ResponseShape<T> = {
  message?: string;
  data?: T;
};

export interface WrappedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map(
        (data: ResponseShape<T>): WrappedResponse<T> => ({
          success: true,
          message: data?.message || "OK",
          data: (data?.data ?? data) as T,
          timestamp: new Date().toISOString(),
        }),
      ),
    );
  }
}
