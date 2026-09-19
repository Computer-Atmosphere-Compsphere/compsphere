/**
 * seed-complete-judging.ts
 *
 * Simulasi penyelesaian penilaian Phase 1 oleh semua judges.
 *
 * Yang dilakukan script ini:
 *  1. Ambil semua judge_assignments yang BELUM ada judge_scores-nya
 *  2. Generate nilai dummy (realistic) untuk setiap assignment yang belum dinilai
 *  3. Hitung final_score per judge: (technical*0.30 + problem*0.20 + innovation*0.25 + market*0.15 + document*0.10)
 *  4. Update status tim menjadi JUDGED jika semua judge (2 judge) sudah menilai
 *
 * Formula nilai akhir per tim (Phase 1):
 *   average_score = (judging1.final_score + judging2.final_score) / 2
 *   (Dihitung di leaderboard query via AVG)
 *
 * Run:
 *   cd packages/db
 *   npx tsx src/seed-complete-judging.ts
 */

import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { db, schema } from "./index";
import { sql } from "drizzle-orm";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDummyScores(originalRank: number, judgeIdx: number): {
  technicalScore: number;
  problemScore: number;
  innovationScore: number;
  marketScore: number;
  documentScore: number;
  finalScore: number;
} {
  let baseMin: number, baseMax: number;
  if (originalRank <= 20) { baseMin = 78; baseMax = 97; }
  else if (originalRank <= 50) { baseMin = 68; baseMax = 88; }
  else if (originalRank <= 80) { baseMin = 55; baseMax = 80; }
  else { baseMin = 45; baseMax = 75; }

  const judgeVariance = judgeIdx % 2 === 0 ? 3 : -3;
  const clamp = (v: number) => Math.min(100, Math.max(1, Math.round(v)));

  const technical  = clamp(randomInt(baseMin, baseMax) + judgeVariance + randomInt(-4, 4));
  const problem    = clamp(randomInt(baseMin, baseMax) + judgeVariance + randomInt(-4, 4));
  const innovation = clamp(randomInt(baseMin, baseMax) + judgeVariance + randomInt(-4, 4));
  const market     = clamp(randomInt(baseMin, baseMax) + judgeVariance + randomInt(-5, 5));
  const document   = clamp(randomInt(baseMin, baseMax) + judgeVariance + randomInt(-4, 4));

  const finalScore = parseFloat(
    (technical * 0.30 + problem * 0.20 + innovation * 0.25 + market * 0.15 + document * 0.10).toFixed(2)
  );

  return { technicalScore: technical, problemScore: problem, innovationScore: innovation, marketScore: market, documentScore: document, finalScore };
}

async function seedCompleteJudging() {
  console.log("COMPSPHERE — Seed Complete Judging Phase 1\n");

  // Step 1: Ambil semua assignments
  console.log("Step 1/4 — Mengambil semua judge assignments...");
  const assignmentRows = await db.execute(sql`
    SELECT
      ja.id          AS assignment_id,
      ja.judge_id,
      ja.team_id,
      ct.original_rank,
      ct.team_code,
      ct.team_name,
      pr.full_name   AS judge_name,
      ROW_NUMBER() OVER (PARTITION BY ja.judge_id ORDER BY ja.team_id) - 1 AS judge_idx
    FROM judge_assignments ja
    INNER JOIN judges j         ON j.id  = ja.judge_id
    INNER JOIN profiles pr      ON pr.id = j.user_id
    INNER JOIN competition_teams ct ON ct.id = ja.team_id
    WHERE j.status = 'ACTIVE'
    ORDER BY ja.judge_id, ct.original_rank ASC
  `);
  const assignments = Array.isArray(assignmentRows) ? assignmentRows : (assignmentRows as any).rows ?? [];
  console.log("   Total assignments: " + assignments.length);

  // Step 2: Ambil scores yang sudah ada
  console.log("Step 2/4 — Cek scores yang sudah ada...");
  const existingScoreRows = await db.execute(sql`SELECT judge_id, team_id FROM judge_scores`);
  const existingScores = Array.isArray(existingScoreRows) ? existingScoreRows : (existingScoreRows as any).rows ?? [];

  const existingSet = new Set<string>(existingScores.map((r: any) => r.judge_id + ":" + r.team_id));
  console.log("   Scores sudah ada: " + existingScores.length);

  const pending = assignments.filter((a: any) => !existingSet.has(a.judge_id + ":" + a.team_id));
  console.log("   Yang perlu di-insert: " + pending.length);

  // Step 3: Insert scores
  console.log("Step 3/4 — Insert dummy scores...");
  const BATCH = 20;
  let inserted = 0;

  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const valueClauses = batch.map((a: any) => {
      const s = generateDummyScores(Number(a.original_rank), Number(a.judge_idx) || 0);
      return sql`(gen_random_uuid(), ${a.judge_id}::uuid, ${a.team_id}::uuid, ${s.technicalScore}, ${s.problemScore}, ${s.innovationScore}, ${s.marketScore}, ${s.documentScore}, ${s.finalScore.toString()}::numeric, NOW() - (RANDOM() * INTERVAL '2 days'), NOW() - (RANDOM() * INTERVAL '12 hours'))`;
    });

    await db.execute(sql`
      INSERT INTO judge_scores (id, judge_id, team_id, technical_score, problem_score, innovation_score, market_score, document_score, final_score, submitted_at, updated_at)
      VALUES ${sql.join(valueClauses, sql`, `)}
      ON CONFLICT (judge_id, team_id) DO NOTHING
    `);
    inserted += batch.length;
    process.stdout.write("\r   Inserted: " + inserted + "/" + pending.length);
  }
  console.log("\n   OK");

  // Step 4: Update status tim ke JUDGED
  console.log("Step 4/4 — Update status tim ke JUDGED...");
  await db.execute(sql`
    UPDATE competition_teams ct
    SET status = 'JUDGED', updated_at = NOW()
    WHERE ct.id IN (
      SELECT ja.team_id
      FROM judge_assignments ja
      GROUP BY ja.team_id
      HAVING COUNT(DISTINCT ja.judge_id) = (
        SELECT COUNT(DISTINCT js2.judge_id) FROM judge_scores js2 WHERE js2.team_id = ja.team_id
      )
      AND COUNT(DISTINCT ja.judge_id) > 0
    )
    AND ct.status NOT IN ('JUDGED')
  `);

  // Status summary
  const statusRows = await db.execute(sql`SELECT status, COUNT(*) as cnt FROM competition_teams GROUP BY status ORDER BY status`);
  const statusResult = Array.isArray(statusRows) ? statusRows : (statusRows as any).rows ?? [];
  console.log("\nStatus tim:");
  for (const row of statusResult as any[]) {
    console.log("   " + row.status + ": " + row.cnt + " tim");
  }

  // Top 10 leaderboard
  console.log("\nTop 10 Leaderboard Phase 1:");
  console.log("(Formula: avg_score = (judging1.final_score + judging2.final_score) / 2 via AVG)\n");
  const lbRows_raw = await db.execute(sql`
    SELECT
      ct.team_code, ct.team_name, ct.category, ct.original_rank,
      COUNT(js.id) AS judge_count,
      ROUND(AVG(js.final_score::numeric), 2) AS average_score
    FROM competition_teams ct
    INNER JOIN judge_scores js ON ct.id = js.team_id
    WHERE ct.status = 'JUDGED'
    GROUP BY ct.id, ct.team_code, ct.team_name, ct.category, ct.original_rank
    ORDER BY average_score DESC, ct.original_rank ASC
    LIMIT 10
  `);
  const lbRows = Array.isArray(lbRows_raw) ? lbRows_raw : (lbRows_raw as any).rows ?? [];

  console.log("No  | Team Code     | Team Name                          | Category     | Judges | Avg Score");
  console.log("----|---------------|------------------------------------|--------------|---------|-----------");
  lbRows.forEach((row: any, idx: number) => {
    const no   = String(idx + 1).padStart(3, " ");
    const code = (row.team_code || "").padEnd(13, " ").slice(0, 13);
    const name = (row.team_name || "").padEnd(34, " ").slice(0, 34);
    const cat  = (row.category || "").padEnd(12, " ").slice(0, 12);
    const jc   = String(row.judge_count).padStart(5, " ");
    const avg  = String(row.average_score).padStart(9, " ");
    console.log(no + " | " + code + " | " + name + " | " + cat + " | " + jc + " | " + avg);
  });

  // Progress stats
  const progressRows = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM judge_assignments)::int AS total_assignments,
      (SELECT COUNT(*) FROM judge_scores)::int      AS total_scores,
      (SELECT COUNT(*) FROM competition_teams WHERE status = 'JUDGED')::int AS judged_teams,
      (SELECT COUNT(*) FROM competition_teams)::int AS total_teams
  `);
  const prog = Array.isArray(progressRows) ? progressRows[0] : ((progressRows as any).rows ?? [])[0] ?? {};
  const pct = prog.total_assignments > 0
    ? Math.round((prog.total_scores / prog.total_assignments) * 100)
    : 0;

  console.log("\nProgress:");
  console.log("   Total Assignments : " + prog.total_assignments);
  console.log("   Total Scores      : " + prog.total_scores);
  console.log("   Tim JUDGED        : " + prog.judged_teams + " / " + prog.total_teams);
  console.log("   Progress          : " + pct + "%");
  console.log("\nSelesai! Buka /admin/judges -> Leaderboard untuk melihat hasil.");

  process.exit(0);
}

seedCompleteJudging().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
