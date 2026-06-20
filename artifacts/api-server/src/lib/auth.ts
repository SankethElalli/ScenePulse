import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const adminClient =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Verify a Supabase Bearer JWT.  Attaches req.userId on success.
 * If Supabase is not configured (missing env vars) all protected routes
 * return 503 Service Unavailable — no fail-open path.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!adminClient) {
    res.status(503).json({ error: "Auth service not configured" });
    return;
  }
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = data.user.id;
  next();
}
