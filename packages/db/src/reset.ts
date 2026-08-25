import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Deletes ALL user-related data so testing can start from a clean slate.
 *
 * Kept (competition master data, not user data):
 *   - competition_teams, proposals, proposal_files
 *   - team_access_tokens (reset to ISSUED / unactivated)
 *   - system_config (kept, updated_by cleared)
 *   - submissions (team-level deliverables)
 *
 * Deleted: every better-auth user/session/account, profile, role assignment,
 * team membership, judge record + scores/assignments, QR tokens, attendance,
 * notifications, audit logs, invites, payments, battle royale state, migration
 * batches.
 */
async function main() {
  console.log("🧹 Resetting all user data...");

  await db.transaction(async (tx) => {
    // 1. Reset team access tokens so they can be re-activated from scratch
    await tx.execute(sql`
      UPDATE team_access_tokens
      SET status = 'ISSUED', activated_by = NULL, activated_at = NULL
    `);

    // 2. Clear audit/config actor references (keep config values)
    await tx.execute(sql`UPDATE system_config SET updated_by = NULL`);
    await tx.execute(sql`DELETE FROM audit_logs`);

    // 3. User-referencing rows (child tables first, FK-safe order)
    await tx.execute(sql`DELETE FROM attendance`);
    await tx.execute(sql`DELETE FROM qr_tokens`);
    await tx.execute(sql`DELETE FROM notifications`);
    await tx.execute(sql`DELETE FROM member_invites`);
    await tx.execute(sql`DELETE FROM payments`);
    await tx.execute(sql`DELETE FROM team_members`);
    await tx.execute(sql`DELETE FROM role_assignments`);
    await tx.execute(sql`DELETE FROM judge_scores`);
    await tx.execute(sql`DELETE FROM judge_assignments`);
    await tx.execute(sql`DELETE FROM judges`);
    await tx.execute(sql`DELETE FROM battle_royale_slots`);
    await tx.execute(sql`DELETE FROM battle_royale_config`);
    await tx.execute(sql`DELETE FROM migration_batches`);

    // 4. Compsphere profiles
    await tx.execute(sql`DELETE FROM profiles`);

    // 5. better-auth tables (user is a reserved word in PostgreSQL → quoted)
    await tx.execute(sql`DELETE FROM "session"`);
    await tx.execute(sql`DELETE FROM "account"`);
    await tx.execute(sql`DELETE FROM "user"`);
  });

  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM profiles) AS profiles,
      (SELECT COUNT(*)::int FROM "user") AS users,
      (SELECT COUNT(*)::int FROM competition_teams) AS teams,
      (SELECT COUNT(*)::int FROM team_access_tokens WHERE status = 'ISSUED') AS tokens
  `);
  const { profiles, users, teams, tokens } = result.rows[0] ?? {};

  console.log("✅ User data reset complete.");
  console.log(`   Remaining: ${profiles} profiles, ${users} auth users`);
  console.log(`   Kept: ${teams} competition teams, ${tokens} issuable access tokens`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
