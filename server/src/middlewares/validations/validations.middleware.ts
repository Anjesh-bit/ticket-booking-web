import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";
import { ZodError } from "zod";

export enum RequestSourceType {
  Body = "body",
  Params = "params",
  Query = "query",
}

export interface ValidationErrorResponse {
  error: string;
  errors: {
    field: string;
    message: string;
  }[];
  success: false;
}

export const validate = (schema: ZodObject, source: RequestSourceType = RequestSourceType.Body) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];

      const validatedData = await schema.parseAsync(dataToValidate);

      req[source] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          error: "Validation failed",
          errors,
          success: false,
        } as ValidationErrorResponse);
      }

      next(error);
    }
  };
};
