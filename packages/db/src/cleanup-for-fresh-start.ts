import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * CLEANUP SCRIPT — Fresh Start for CompSphere 12 Production
 *
 * Deletes:
 *  1. All competition team data and every table that references it
 *     (cascade): proposals, proposal_files, team_access_tokens,
 *     team_members, payments, submissions, judge_scores,
 *     judge_assignments, battle_royale_slots, battle_royale_config,
 *     qr_tokens, notifications (team-linked), member_invites.
 *
 *  2. Inactive judges (status = 'INACTIVE') — their profiles, role
 *     assignments, sessions, and better-auth accounts are also removed.
 *     Active judges are kept.
 *
 *  3. system_config keys related to Battle Royale state:
 *     - phase1_leaderboard
 *     - phase1_slot_confirmations
 *     - phase1_email_logs
 *
 * Keeps:
 *  - All ACTIVE judge records + their profiles / auth sessions
 *  - ADMIN profiles + auth sessions
 *  - Other system_config keys (not Battle Royale ones)
 *  - migration_batches (history reference)
 *  - audit_logs
 */

async function main() {
  console.log("🧹 Starting CompSphere fresh-start cleanup...\n");

  // ── 0. PRE-FLIGHT: show current counts ───────────────────────────────────
  const pre = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM competition_teams)         AS teams,
      (SELECT COUNT(*)::int FROM proposals)                 AS proposals,
      (SELECT COUNT(*)::int FROM proposal_files)            AS proposal_files,
      (SELECT COUNT(*)::int FROM judge_scores)              AS judge_scores,
      (SELECT COUNT(*)::int FROM judge_assignments)         AS judge_assignments,
      (SELECT COUNT(*)::int FROM judges WHERE status = 'INACTIVE') AS inactive_judges,
      (SELECT COUNT(*)::int FROM judges WHERE status = 'ACTIVE')   AS active_judges,
      (SELECT COUNT(*)::int FROM battle_royale_slots)       AS br_slots,
      (SELECT COUNT(*)::int FROM battle_royale_config)      AS br_config,
      (SELECT COUNT(*)::int FROM system_config
        WHERE key IN (
          'phase1_leaderboard',
          'phase1_slot_confirmations',
          'phase1_email_logs'
        ))                                                  AS br_config_keys,
      (SELECT COUNT(*)::int FROM payments)                  AS payments,
      (SELECT COUNT(*)::int FROM team_members)              AS team_members,
      (SELECT COUNT(*)::int FROM submissions)               AS submissions
  `);

  const counts = pre.rows[0] as Record<string, number>;
  console.log("📊 BEFORE cleanup:");
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
  console.log();

  // ── 1. MAIN TRANSACTION ──────────────────────────────────────────────────
  await db.transaction(async (tx) => {

    // ── 1a. Get IDs of INACTIVE judges (for profile cleanup) ────────────────
    const inactiveJudgeUsers = await tx.execute(sql`
      SELECT j.user_id FROM judges j WHERE j.status = 'INACTIVE'
    `);
    const inactiveUserIds: string[] = (inactiveJudgeUsers.rows as any[]).map(r => r.user_id);
    console.log(`🗑️  Found ${inactiveUserIds.length} inactive judge(s) to remove.`);

    // ── 1b. Delete all data that cascades from competition_teams ──────────
    // Most child tables have ON DELETE CASCADE. We delete in safe FK order
    // for tables that don't have cascade defined.
    console.log("🗑️  Deleting Battle Royale config & slots...");
    await tx.execute(sql`DELETE FROM battle_royale_slots`);
    await tx.execute(sql`DELETE FROM battle_royale_config`);

    console.log("🗑️  Deleting judge scores & assignments...");
    await tx.execute(sql`DELETE FROM judge_scores`);
    await tx.execute(sql`DELETE FROM judge_assignments`);

    console.log("🗑️  Deleting payments, submissions, QR tokens...");
    await tx.execute(sql`DELETE FROM payments`);
    await tx.execute(sql`DELETE FROM submissions`);
    await tx.execute(sql`DELETE FROM qr_tokens`);

    console.log("🗑️  Deleting team members & member invites...");
    await tx.execute(sql`DELETE FROM team_members`);
    await tx.execute(sql`DELETE FROM member_invites`);

    console.log("🗑️  Deleting proposals & proposal files...");
    await tx.execute(sql`DELETE FROM proposal_files`);
    await tx.execute(sql`DELETE FROM proposals`);

    console.log("🗑️  Deleting team access tokens...");
    await tx.execute(sql`DELETE FROM team_access_tokens`);

    console.log("🗑️  Deleting team-linked notifications...");
    await tx.execute(sql`DELETE FROM notifications WHERE team_id IS NOT NULL`);

    console.log("🗑️  Deleting role assignments linked to teams...");
    await tx.execute(sql`DELETE FROM role_assignments WHERE team_id IS NOT NULL`);

    console.log("🗑️  Deleting competition teams...");
    await tx.execute(sql`DELETE FROM competition_teams`);

    // ── 1c. Remove inactive judges + their related data ─────────────────
    if (inactiveUserIds.length > 0) {
      console.log("🗑️  Removing inactive judges + related auth data...");

      // Delete judge records first (FK: judge_assignments/scores already gone)
      await tx.execute(sql`
        DELETE FROM judges WHERE status = 'INACTIVE'
      `);

      // Delete role assignments for those users
      for (const uid of inactiveUserIds) {
        await tx.execute(sql`
          DELETE FROM role_assignments WHERE user_id = ${uid}
        `);
      }

      // Delete notifications linked to those users
      for (const uid of inactiveUserIds) {
        await tx.execute(sql`
          DELETE FROM notifications WHERE user_id = ${uid}
        `);
      }

      // Delete better-auth sessions & accounts for those users, then profile
      // Must look up better-auth user by matching email with profiles.email
      for (const uid of inactiveUserIds) {
        // Null out audit_log actor_id references (keep the log, just remove the actor FK)
        await tx.execute(sql`UPDATE audit_logs SET actor_id = NULL WHERE actor_id = ${uid}`);
        // Null out system_config updated_by references
        await tx.execute(sql`UPDATE system_config SET updated_by = NULL WHERE updated_by = ${uid}`);

        // Delete remaining role assignments (including any not team-linked)
        await tx.execute(sql`DELETE FROM role_assignments WHERE user_id = ${uid}`);

        // Get profile email
        const profileRow = await tx.execute(sql`
          SELECT email FROM profiles WHERE id = ${uid} LIMIT 1
        `);
        const email = (profileRow.rows[0] as any)?.email;

        if (email) {
          // Delete better-auth account chain
          const baUser = await tx.execute(sql`
            SELECT id FROM "user" WHERE email = ${email} LIMIT 1
          `);
          const baId = (baUser.rows[0] as any)?.id;
          if (baId) {
            await tx.execute(sql`DELETE FROM "session" WHERE user_id = ${baId}`);
            await tx.execute(sql`DELETE FROM "account" WHERE user_id = ${baId}`);
            await tx.execute(sql`DELETE FROM "user" WHERE id = ${baId}`);
          }
        }

        // Delete profile
        await tx.execute(sql`DELETE FROM profiles WHERE id = ${uid}`);
      }

      console.log(`   ✅ Removed ${inactiveUserIds.length} inactive judge(s) and their auth data.`);
    } else {
      console.log("   ✅ No inactive judges found — nothing to remove.");
    }

    // ── 1d. Clear Battle Royale system_config keys ────────────────────────
    console.log("🗑️  Clearing Battle Royale system_config keys...");
    await tx.execute(sql`
      DELETE FROM system_config
      WHERE key IN (
        'phase1_leaderboard',
        'phase1_slot_confirmations',
        'phase1_email_logs'
      )
    `);

    console.log("   ✅ Battle Royale state cleared from system_config.");
  });

  // ── 2. POST-FLIGHT: verify counts ────────────────────────────────────────
  const post = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM competition_teams)         AS teams,
      (SELECT COUNT(*)::int FROM proposals)                 AS proposals,
      (SELECT COUNT(*)::int FROM proposal_files)            AS proposal_files,
      (SELECT COUNT(*)::int FROM judge_scores)              AS judge_scores,
      (SELECT COUNT(*)::int FROM judge_assignments)         AS judge_assignments,
      (SELECT COUNT(*)::int FROM judges WHERE status = 'INACTIVE') AS inactive_judges,
      (SELECT COUNT(*)::int FROM judges WHERE status = 'ACTIVE')   AS active_judges,
      (SELECT COUNT(*)::int FROM battle_royale_slots)       AS br_slots,
      (SELECT COUNT(*)::int FROM battle_royale_config)      AS br_config,
      (SELECT COUNT(*)::int FROM system_config
        WHERE key IN (
          'phase1_leaderboard',
          'phase1_slot_confirmations',
          'phase1_email_logs'
        ))                                                  AS br_config_keys,
      (SELECT COUNT(*)::int FROM payments)                  AS payments,
      (SELECT COUNT(*)::int FROM team_members)              AS team_members,
      (SELECT COUNT(*)::int FROM submissions)               AS submissions
  `);

  const after = post.rows[0] as Record<string, number>;
  console.log("\n📊 AFTER cleanup:");
  Object.entries(after).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  console.log("\n✅ Fresh-start cleanup complete!");
  console.log("   Active judges and admin profiles are untouched.");
  console.log("   Database is ready for real competition data upload.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
