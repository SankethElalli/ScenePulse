import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { getConnectionConfig } from "./connection";

const { Pool } = pg;

export const pool = new Pool(getConnectionConfig());
export const db = drizzle(pool, { schema });

export * from "./schema";
export { getConnectionConfig } from "./connection";
