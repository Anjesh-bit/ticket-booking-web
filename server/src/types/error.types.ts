import type { NextFunction, Request, Response } from "express";

export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => Promise<Response | void>;

export interface AuthenticatedRequest extends Request {
  id?: string;
  user?: User;
}

export interface ClassifiedError {
  message: string | string[];
  statusCode: number;
  type: ErrorType;
}

export interface ErrorContext {
  error: {
    message: string;
    name: string;
    stack?: string;
    statusCode?: number;
  };
  request: {
    body: unknown;
    ip?: string;
    method: string;
    params: unknown;
    query: unknown;
    url: string;
    userAgent?: string;
    userId: string;
  };
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    details?: unknown;
    field?: string;
    message: string | string[];
    method: string;
    path: string;
    requestId?: string;
    stack?: string;
    timestamp: string;
    type: ErrorType;
  };
  success: false;
}

export type ErrorType =
  | "application"
  | "authentication"
  | "http"
  | "syntax"
  | "unknown"
  | "validation"
  | "cast";

export interface FormattedErrorResponse {
  response: ErrorResponse;
  statusCode: number;
}

export interface User {
  [key: string]: unknown;
  id: string;
}
