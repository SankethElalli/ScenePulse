type PoolConfig = {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: { rejectUnauthorized: boolean };
  connectionString?: string;
};

const CONN_RE =
  /^(postgres(?:ql)?):\/\/([^:@/]+):(.*)@([^:/?@]+)(?::(\d+))?(?:\/([^?]*))?(?:\?(.*))?$/;

function isSupabaseHost(host: string): boolean {
  return host.endsWith(".supabase.co") || host.endsWith(".supabase.com");
}

/**
 * Build a pg/drizzle connection config from a connection string.
 *
 * Well-formed URLs are passed through verbatim as `connectionString` so that
 * query parameters (e.g. `sslmode`, `application_name`) are preserved.
 *
 * Postgres passwords frequently contain characters that are unsafe in a URL
 * (e.g. "/", "@", ":"). When such a value is pasted without percent-encoding,
 * the standard URL parser misreads the host (it stops the authority at the first
 * "/"), producing errors like `getaddrinfo ENOTFOUND postgres`. Only in that
 * malformed case do we decompose into discrete fields so the connection works.
 */
export function getConnectionConfig(): PoolConfig {
  const raw = pickConnectionString();

  if (!raw) {
    throw new Error(
      "SUPABASE_DB_URL or DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  const m = raw.match(CONN_RE);
  if (!m) {
    return { connectionString: raw };
  }

  const [, , user, pass, host, port, database] = m;

  let urlHost: string | null = null;
  try {
    urlHost = new URL(raw).hostname;
  } catch {
    urlHost = null;
  }

  // If the URL parser saw a different host than our tolerant regex, the password
  // contained unencoded characters and the raw string is unusable as-is. Only
  // then do we fall back to discrete fields (which cannot preserve query params).
  const malformed = urlHost !== host;

  if (!malformed) {
    const config: PoolConfig = { connectionString: raw };
    if (isSupabaseHost(host)) {
      config.ssl = { rejectUnauthorized: false };
    }
    return config;
  }

  const config: PoolConfig = {
    user: decodeURIComponent(user),
    password: pass,
    host,
    port: port ? Number(port) : 5432,
    database: database || undefined,
  };
  if (isSupabaseHost(host)) {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

/**
 * Choose which connection string to use.
 *
 * Supabase's *direct* connection host (`db.<ref>.supabase.co`) is IPv6-only on
 * newer projects and is unreachable from IPv4-only environments like Replit,
 * which surfaces as `ENOTFOUND db.<ref>.supabase.co`. Use the Supabase pooler
 * connection string (`<...>.pooler.supabase.com`) instead. Until a reachable
 * Supabase URL is provided, fall back to DATABASE_URL so the app keeps working.
 */
function pickConnectionString(): string | undefined {
  const supabase = process.env.SUPABASE_DB_URL;
  const fallback = process.env.DATABASE_URL;

  if (supabase) {
    const directHost = /@db\.[^.]+\.supabase\.co\b/.test(supabase);
    if (directHost && fallback) {
      console.warn(
        "[db] SUPABASE_DB_URL uses the IPv6-only direct host (db.*.supabase.co), " +
          "which is unreachable from this environment. Falling back to DATABASE_URL. " +
          "Provide the Supabase pooler connection string (*.pooler.supabase.com) to use Supabase.",
      );
      return fallback;
    }
    return supabase;
  }

  return fallback;
}
