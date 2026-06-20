import { defineConfig } from "drizzle-kit";
import path from "path";
import { getConnectionConfig } from "./src/connection";

const config = getConnectionConfig();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: config.connectionString
    ? { url: config.connectionString }
    : {
        host: config.host!,
        port: config.port!,
        user: config.user!,
        password: config.password!,
        database: config.database!,
        ssl: config.ssl ?? false,
      },
});
