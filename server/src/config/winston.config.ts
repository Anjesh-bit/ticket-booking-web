import { ENVIRONMENT } from "#constants/env.constant.js";

const [production] = ENVIRONMENT;

export const WINSTON_LOG_LEVELS = {
  debug: 5,
  error: 0,
  http: 3,
  info: 2,
  silly: 6,
  verbose: 4,
  warn: 1,
};

export const WINSTON_LOG_LEVEL = process.env.NODE_ENV === production ? "info" : "debug";

export const WINSTON_LOG_FILE_PATH = "src/storage/logs/";
export const WINSTON_COMBINED_LOG_FILENAME = "combined-%DATE%.log";
export const WINSTON_ERROR_LOG_FILENAME = "error-%DATE%.log";
export const WINSTON_LOG_DATE_PATTERN = "YYYY-MM-DD";
export const WINSTON_MAX_LOG_FILE_SIZE = "20m";
export const WINSTON_MAX_COMBINED_LOG_FILES = "14d";
export const WINSTON_MAX_ERROR_LOG_FILES = "30d";
