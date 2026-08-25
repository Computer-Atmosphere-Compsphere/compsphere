import * as dotenv from "dotenv";
import path from "path";

// Initialize dotenv from workspace root or current folder
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";


const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://compsphere:compsphere_dev@localhost:5432/compsphere";

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;

export { schema };
export * from "./schema";
