import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";


async function main() {
  console.log("🔄 Running database migrations...");
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../migrations"),
  });
  console.log("✅ Migrations complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
