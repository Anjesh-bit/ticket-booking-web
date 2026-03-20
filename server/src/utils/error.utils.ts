import {
  DEFAULT_ERROR_MESSAGE,
  ERROR_TYPES,
  HTTP_STATUS,
  PG_ERROR_CODES,
  SENSITIVE_FIELDS,
} from "#constants/errors.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import { AppError, ValidationError } from "#services/error.services.js";

import type {
  AuthenticatedRequest,
  ClassifiedError,
  ErrorContext,
  FormattedErrorResponse,
} from "#types/error.types.js";

const sanitizeBody = (body: unknown): unknown => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;

  const sanitized: Record<string, unknown> = { ...(body as Record<string, unknown>) };

  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "***REDACTED***";
    }
  }

  return sanitized;
};

const extractPgColumn = (detail?: unknown): string | undefined =>
  typeof detail === "string" ? detail.match(/Key \((.+?)\)/)?.[1] : undefined;

const isPgError = (err: Record<string, unknown>): boolean =>
  typeof err["code"] === "string" && /^\d{5}$|^[0-9A-Z]{5}$/.test(err["code"] as string);

const classifyError = (error: unknown): ClassifiedError => {
  if (!error || typeof error !== "object") {
    return {
      message: DEFAULT_ERROR_MESSAGE,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      type: "unknown",
    };
  }

  const err = error as Record<string, unknown>;

  if (isPgError(err)) {
    switch (err["code"]) {
      case PG_ERROR_CODES.UNIQUE_VIOLATION:
        return {
          message: extractPgColumn(err["detail"])
            ? `${extractPgColumn(err["detail"])} already exists`
            : "Resource already exists",
          statusCode: HTTP_STATUS.CONFLICT,
          type: "validation",
        };

      case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
        return {
          message: typeof err["detail"] === "string" ? err["detail"] : "Related resource not found",
          statusCode: HTTP_STATUS.BAD_REQUEST,
          type: "validation",
        };

      case PG_ERROR_CODES.NOT_NULL_VIOLATION:
        return {
          message:
            typeof err["column"] === "string"
              ? `${err["column"]} is required`
              : "Required field missing",
          statusCode: HTTP_STATUS.BAD_REQUEST,
          type: "validation",
        };

      case PG_ERROR_CODES.CHECK_VIOLATION:
        return {
          message:
            typeof err["constraint"] === "string"
              ? `Constraint violated: ${err["constraint"]}`
              : "Value failed validation",
          statusCode: HTTP_STATUS.BAD_REQUEST,
          type: "validation",
        };

      case PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
        return {
          message: "Invalid format — check IDs and enum values",
          statusCode: HTTP_STATUS.BAD_REQUEST,
          type: "cast",
        };

      case PG_ERROR_CODES.CONNECTION_FAILURE:
      case PG_ERROR_CODES.TOO_MANY_CONNECTIONS:
        return {
          message: "Database temporarily unavailable",
          statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
          type: "unknown",
        };

      default:
        return {
          message: DEFAULT_ERROR_MESSAGE,
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          type: "unknown",
        };
    }
  }

  if (err["name"] === ERROR_TYPES.SYNTAX_ERROR) {
    return {
      message: "Invalid request format",
      statusCode: HTTP_STATUS.BAD_REQUEST,
      type: "syntax",
    };
  }

  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      type: "application",
    };
  }

  const statusCode =
    typeof err["statusCode"] === "number"
      ? err["statusCode"]
      : typeof err["status"] === "number"
        ? err["status"]
        : null;

  if (statusCode !== null) {
    return {
      message: typeof err["message"] === "string" ? err["message"] : DEFAULT_ERROR_MESSAGE,
      statusCode,
      type: "http",
    };
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    type: "unknown",
  };
};

const createErrorContext = (
  error: Error,
  req: AuthenticatedRequest,
  timestamp: string,
): ErrorContext => ({
  error: {
    message: error.message,
    name: error.name,
    stack: error.stack,
    statusCode: (error as AppError).statusCode,
  },
  request: {
    body: sanitizeBody(req.body as unknown),
    ip: req.ip ?? req.socket?.remoteAddress,
    method: req.method,
    params: req.params,
    query: req.query as Record<string, unknown>,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id ?? "anonymous",
  },
  timestamp,
});

const logError = (error: Error, req: AuthenticatedRequest, timestamp: string): void => {
  const context = createErrorContext(error, req, timestamp);

  if (process.env.NODE_ENV === "production") {
    logger.error(JSON.stringify(context));
  } else {
    logger.error("\n🚨 Error Details:", JSON.stringify(context, null, 2));
  }
};

const createErrorResponse = (
  error: Error,
  req: AuthenticatedRequest,
  timestamp: string,
): FormattedErrorResponse => {
  const classified = classifyError(error);
  const isProduction = process.env.NODE_ENV === "production";

  const response: FormattedErrorResponse["response"] = {
    error: {
      message: classified.message,
      method: req.method,
      path: req.originalUrl,
      timestamp,
      type: classified.type,
    },
    success: false,
  };

  if (req.id) response.error.requestId = req.id;

  if (!isProduction && error.stack) {
    response.error.stack = error.stack;
    response.error.details = error.message;
  }

  if (error instanceof ValidationError && error.field) {
    response.error.field = error.field;
  }

  return { response, statusCode: classified.statusCode };
};

const setupGlobalErrorHandlers = (): void => {
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
};

export { classifyError, createErrorResponse, logError, setupGlobalErrorHandlers };
