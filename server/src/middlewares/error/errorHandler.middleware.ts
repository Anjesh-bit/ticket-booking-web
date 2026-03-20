import type { NextFunction, RequestHandler, Response } from "express";

import { NotFoundError } from "#services/error.services.js";

import type { AsyncRequestHandler, AuthenticatedRequest } from "#types/error.types.js";
import { createErrorResponse, logError } from "#utils/error.utils.js";

export const errorHandler = (
  error: Error,
  req: AuthenticatedRequest,
  res: Response,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const timestamp = new Date().toISOString();

  logError(error, req, timestamp);

  const { response, statusCode } = createErrorResponse(error, req, timestamp);

  res.removeHeader("X-Powered-By");
  res.status(statusCode).json(response);
};

export const notFoundHandler: RequestHandler = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
};

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
