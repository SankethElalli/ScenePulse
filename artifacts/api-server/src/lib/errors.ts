import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "./logger";

/** Duck-typed ZodError check to avoid a direct zod dependency. */
function isZodError(err: unknown): err is { name: string; issues: unknown[] } {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "ZodError" &&
    Array.isArray((err as { issues?: unknown }).issues)
  );
}

/** 404 handler for unmatched routes — returns JSON instead of Express's HTML. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
};

/**
 * Centralized error handler. Maps Zod validation failures to 400 and
 * everything else to 500, always returning JSON. Must be mounted last.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isZodError(err)) {
    res.status(400).json({ error: "Validation failed", issues: err.issues });
    return;
  }

  logger.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
};
