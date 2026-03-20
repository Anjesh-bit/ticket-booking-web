export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const ERROR_TYPES = {
  CAST_ERROR: "CastError",
  SYNTAX_ERROR: "SyntaxError",
  VALIDATION_ERROR: "ValidationError",
} as const;

export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
  INVALID_TEXT_REPRESENTATION: "22P02",
  CONNECTION_FAILURE: "08006",
  TOO_MANY_CONNECTIONS: "53300",
} as const;

export const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

export const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "authorization",
  "apikey",
  "api_key",
  "creditcard",
  "credit_card",
  "cvv",
  "ssn",
] as const;
