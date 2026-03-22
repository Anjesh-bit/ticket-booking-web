import {
  DEFAULT_ERROR_MESSAGE,
  ERROR_TYPES,
  HTTP_STATUS,
  PG_ERROR_CODES,
  SENSITIVE_FIELDS,
} from "#constants/errors.constant.js";
import logger from "#lib/helpers/winston.helpers.js";
import { AppError } from "#services/error.service.js";
import type {
  AuthenticatedRequest,
  ClassifiedError,
  ErrorContext,
  FormattedErrorResponse,
} from "#types/error.types.js";

type PgHandler = (err: Record<string, unknown>) => ClassifiedError;

const sanitizeBody = (body: unknown): unknown => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;

  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([key, value]) => [
      key,
      SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f)) ? "***REDACTED***" : value,
    ]),
  );
};

const isPgError = (err: Record<string, unknown>): boolean =>
  typeof err["code"] === "string" && /^[\dA-Z]{5}$/.test(err["code"]);

const extractPgColumn = (detail: unknown): string | undefined =>
  typeof detail === "string" ? detail.match(/Key \((.+?)\)/)?.[1] : undefined;

const PG_ERROR_MAP: Record<string, PgHandler> = {
  [PG_ERROR_CODES.UNIQUE_VIOLATION]: (err) => ({
    message: extractPgColumn(err["detail"])
      ? `${extractPgColumn(err["detail"])} already exists`
      : "Resource already exists",
    statusCode: HTTP_STATUS.CONFLICT,
    type: "validation",
  }),
  [PG_ERROR_CODES.FOREIGN_KEY_VIOLATION]: (err) => ({
    message: typeof err["detail"] === "string" ? err["detail"] : "Related resource not found",
    statusCode: HTTP_STATUS.BAD_REQUEST,
    type: "validation",
  }),
  [PG_ERROR_CODES.NOT_NULL_VIOLATION]: (err) => ({
    message:
      typeof err["column"] === "string" ? `${err["column"]} is required` : "Required field missing",
    statusCode: HTTP_STATUS.BAD_REQUEST,
    type: "validation",
  }),
  [PG_ERROR_CODES.CHECK_VIOLATION]: (err) => ({
    message:
      typeof err["constraint"] === "string"
        ? `Constraint violated: ${err["constraint"]}`
        : "Value failed validation",
    statusCode: HTTP_STATUS.BAD_REQUEST,
    type: "validation",
  }),
  [PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION]: () => ({
    message: "Invalid format — check IDs and enum values",
    statusCode: HTTP_STATUS.BAD_REQUEST,
    type: "cast",
  }),
  [PG_ERROR_CODES.CONNECTION_FAILURE]: () => ({
    message: "Database temporarily unavailable",
    statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    type: "unknown",
  }),
  [PG_ERROR_CODES.TOO_MANY_CONNECTIONS]: () => ({
    message: "Database temporarily unavailable",
    statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    type: "unknown",
  }),
};

const classifyError = (error: unknown): ClassifiedError => {
  const fallback: ClassifiedError = {
    message: DEFAULT_ERROR_MESSAGE,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    type: "unknown",
  };

  if (!error || typeof error !== "object") return fallback;

  const err = error as Record<string, unknown>;

  if (isPgError(err)) return PG_ERROR_MAP[err["code"] as string]?.(err) ?? fallback;

  if (err["name"] === ERROR_TYPES.SYNTAX_ERROR)
    return {
      message: "Invalid request format",
      statusCode: HTTP_STATUS.BAD_REQUEST,
      type: "syntax",
    };

  if (error instanceof AppError)
    return { message: error.message, statusCode: error.statusCode, type: "application" };

  return fallback;
};

const logError = (error: Error, req: AuthenticatedRequest, timestamp: string): void => {
  const context: ErrorContext = {
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
  };

  const payload =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(context)
      : `\n🚨 ${JSON.stringify(context, null, 2)}`;

  logger.error(payload);
};

const createErrorResponse = (
  error: Error,
  req: AuthenticatedRequest,
  timestamp: string,
): FormattedErrorResponse => {
  const classified = classifyError(error);

  return {
    response: {
      error: {
        message: classified.message,
        method: req.method,
        path: req.originalUrl,
        timestamp,
        type: classified.type,
        ...(process.env.NODE_ENV !== "production" &&
          error.stack && {
            stack: error.stack,
            details: error.message,
          }),
      },
      success: false,
    },
    statusCode: classified.statusCode,
  };
};

const setupGlobalErrorHandlers = (): void => {
  process.on("uncaughtException", (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(`Unhandled Rejection: ${String(reason)}`);
    process.exit(1);
  });
};

export { classifyError, createErrorResponse, logError, setupGlobalErrorHandlers };
