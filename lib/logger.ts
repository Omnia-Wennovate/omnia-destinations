/**
 * Safe logger — hides sensitive details in production.
 * Use this instead of console.log / console.error in all service files.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.log("[service] message", data);
 *   logger.error("[service] error message", err);
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  /** Logs only in development — never in production */
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },

  /** In production, logs only the message string — never the raw error object */
  error: (message: string, err?: unknown): void => {
    if (isDev) {
      console.error(message, err);
    } else {
      // Redact raw error details — safe for production
      const safeMsg =
        err instanceof Error ? `${message} [${err.message}]` : message;
      console.error(safeMsg);
    }
  },

  /** Warnings always show (no sensitive data) */
  warn: (message: string): void => {
    console.warn(message);
  },
};
