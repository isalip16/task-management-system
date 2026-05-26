import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

type ExceptionResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = "Internal server error";
    let errors: string[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as ExceptionResponse;

        const respMessage = resp.message;

        if (Array.isArray(respMessage)) {
          message = "Validation failed";
          errors = respMessage;
        } else {
          message = respMessage || message;
          errors = null;
        }
      }
    } else if (exception instanceof Error) {
      const err = exception as Error & { code?: number };

      if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        message = "A record with this value already exists";
      } else {
        this.logger.error(err.message, err.stack);
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
