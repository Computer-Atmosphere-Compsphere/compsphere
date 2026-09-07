import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { scoringService } from "../services/scoring.service";
import { db, schema } from "@compsphere/db";
import { eq, and, sql } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "../services/audit.service";
import { z } from "zod";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { uploadFileToStorage } from "../lib/storage";

const router = Router();

/**
 * PDF Generator for Dummy Proposal Documents
 */
function generateRichProposalPDF(
  title: string,
  teamName: string,
  teamCode: string,
  category: string,
  idx: number
): Buffer {
  const topics = [
    "Artificial Intelligence & Autonomous Systems",
    "Smart IoT Infrastructure & Edge Computing",
    "Decentralized Finance & Blockchain Protocol",
    "Cloud Native Microservices & High-Scale Analytics",
    "Zero-Trust Cybersecurity & Cryptographic Systems",
    "Big Data Intelligence & Predictive Analytics",
    "Cross-Platform Mobile Ecosystem",
    "Sustainable Energy & Green Tech Solutions",
    "Digital Health & AI-Powered Diagnostics",
    "EdTech & Interactive Learning Platform"
  ];
  const topic = topics[idx % topics.length];

  const lines = [
    "=========================================================================================",
    `                     COMPSPHERE 2026 -- OFFICIAL PROPOSAL DOCUMENT`,
    "=========================================================================================",
    "",
    `PROJECT TITLE : ${title}`,
    `TEAM NAME     : ${teamName}`,
    `TEAM CODE     : ${teamCode}`,
    `CATEGORY      : ${category}`,
    `TRACK TOPIC   : ${topic}`,
    `SUBMITTED AT  : September 2026`,
    "",
    "-----------------------------------------------------------------------------------------",
    "1. EXECUTIVE SUMMARY & VALUE PROPOSITION",
    "-----------------------------------------------------------------------------------------",
    `Platform inovatif ini dikembangkan oleh tim ${teamName} sebagai solusi komprehensif`,
    `berbasis ${topic}. Proyek ini dirancang untuk mengatasi tantangan skala nasional`,
    "melalui arsitektur software berkinerja tinggi, keamanan data tingkat tinggi, dan",
    "pengalaman pengguna (UX) yang sangat intuitif.",
    "",
    "Key Highlights:",
    " - 100% cloud-native architecture dengan ketersediaan tinggi (99.9% uptime).",
    " - Efisiensi pemrosesan data meningkat hingga 65% dibandingkan metode konvensional.",
    " - Desain modular yang siap diintegrasikan dengan infrastruktur eksisting.",
    "",
    "-----------------------------------------------------------------------------------------",
    "2. PROBLEM STATEMENT & MARKET NEED",
    "-----------------------------------------------------------------------------------------",
    `Di era transformasi digital saat ini, sektor terkait ${topic} menghadapi berbagai kendala:`,
    " 1. Fragmentasi data dan lambatnya kecepatan respons sistem terpusat.",
    " 2. Kurangnya transparansi dan keandalan sistem audit otomatis.",
    " 3. Tingginya biaya operasional untuk perawatan dan pengembangan infrastruktur.",
    "",
    `Tim ${teamName} mengidentifikasi bahwa kebutuhan akan efisiensi dan otomasi merupakan`,
    "prioritas utama bagi pengguna dan pemangku kepentingan.",
    "",
    "-----------------------------------------------------------------------------------------",
    "3. PROPOSED SYSTEM ARCHITECTURE & INNOVATION",
    "-----------------------------------------------------------------------------------------",
    "Sistem ini menggunakan arsitektur microservices terdistribusi dengan komponen:",
    " - Frontend Layer : React.js / Next.js SPA dengan PWA & Glassmorphism UI.",
    " - API Gateway    : Express / Node.js High-Throughput Gateway dengan TLS 1.3.",
    " - Microservices  : Python FastAPI Services untuk pemrosesan AI/ML.",
    " - Database Layer : PostgreSQL Relational DB + Redis Caching Layer.",
    " - Storage Bridge : Secure Presigned Object Storage untuk dokumen & aset media.",
    "",
    "Keunggulan Inovasi (Unique Value Proposition):",
    " * Otomasi alur kerja real-time berbasis WebSockets dan Event-Driven Architecture.",
    " * Enkripsi end-to-end pada data sensitif baik at-rest maupun in-transit.",
    "",
    "-----------------------------------------------------------------------------------------",
    "4. IMPLEMENTATION ROADMAP & FEASIBILITY",
    "-----------------------------------------------------------------------------------------",
    " - Phase 1 (Q3 2026): Requirement Analysis, Architecture Design & MVP Core Build",
    " - Phase 2 (Q4 2026): Beta Testing, Security Audit & Judge Evaluation Integration",
    " - Phase 3 (Q1 2027): Commercial Rollout, Partner Integration & Scaling",
    "",
    "-----------------------------------------------------------------------------------------",
    `Document generated automatically for COMPSPHERE 2026 Judge Evaluation Panel.`,
    `Ref ID: ${teamCode}-PROP-${idx + 1001}`,
    "========================================================================================="
  ];

  const textCmds = lines.reduce((acc, line) => {
    const escaped = line
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    return acc + `(${escaped}) Tj\nT*\n`;
  }, "BT\n/F1 9 Tf\n40 800 Td\n12 TL\n") + "ET\n";

  const streamBuf = Buffer.from(textCmds, "latin1");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const obj4h = `4 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`;
  const obj4f = "\nendstream\nendobj\n";
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";

  const header = Buffer.from("%PDF-1.4\n");
  const b1 = Buffer.from(obj1);
  const b2 = Buffer.from(obj2);
  const b3 = Buffer.from(obj3);
  const b4h = Buffer.from(obj4h);
  const b4f = Buffer.from(obj4f);
  const b5 = Buffer.from(obj5);

  const off1 = header.length;
  const off2 = off1 + b1.length;
  const off3 = off2 + b2.length;
  const off4 = off3 + b3.length;
  const off5 = off4 + b4h.length + streamBuf.length + b4f.length;
  const xrefPos = off5 + b5.length;

  const xref = `xref
0 6
0000000000 65535 f 
${String(off1).padStart(10, "0")} 00000 n 
${String(off2).padStart(10, "0")} 00000 n 
${String(off3).padStart(10, "0")} 00000 n 
${String(off4).padStart(10, "0")} 00000 n 
${String(off5).padStart(10, "0")} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefPos}
%%EOF`;

  return Buffer.concat([
    header,
    b1,
    b2,
    b3,
    b4h,
    streamBuf,
    b4f,
    b5,
    Buffer.from(xref, "latin1"),
  ]);
}

// ═══════════════════════════════════════════════════════════════════
// JUDGE PORTAL (authenticated as JUDGE)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get assigned teams for active judge
 * GET /api/judges/my-assignments
 */
router.get("/my-assignments", requireAuth, requireRole("JUDGE"), async (req, res, next) => {
  try {
    const user = req.sessionUser!;

    // Single raw SQL join — avoids Drizzle ORM relational N+1 / UUID binding issues
    const rows = await db.execute(sql`
      SELECT
        ja.id              AS assignment_id,
        ja.assigned_at,
        ct.id              AS team_id,
        ct.team_code,
        ct.team_name,
        ct.category,
        ct.status          AS team_status,
        ct.original_rank,
        p.id               AS proposal_id,
        p.title            AS proposal_title,
        p.description      AS proposal_description,
        p.devpost_url,
        js.id              AS score_id,
        js.technical_score,
        js.problem_score,
        js.innovation_score,
        js.market_score,
        js.document_score,
        js.final_score,
        js.submitted_at    AS score_submitted_at,
        js.updated_at      AS score_updated_at,
        j.id               AS judge_id
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      INNER JOIN judge_assignments ja ON ja.judge_id = j.id
      INNER JOIN competition_teams ct ON ct.id = ja.team_id
      LEFT JOIN proposals p ON p.team_id = ct.id
      LEFT JOIN judge_scores js ON js.judge_id = j.id AND js.team_id = ct.id
      WHERE (pr.id::text = ${user.profileId} OR pr.email = ${user.email})
        AND j.status = 'ACTIVE'
      ORDER BY ja.assigned_at ASC
    `);

    const rawRows = Array.isArray(rows) ? rows : (rows as any).rows ?? [];

    const proposalIds = Array.from(new Set(rawRows.map((r: any) => r.proposal_id).filter(Boolean)));
    const teamIds = Array.from(new Set(rawRows.map((r: any) => r.team_id).filter(Boolean)));

    // Fetch proposal files safely
    const filesMap: Record<string, any[]> = {};
    if (proposalIds.length > 0) {
      try {
        const fileRows = await db.execute(sql`
          SELECT id, proposal_id, storage_key, original_filename, mime_type, size_bytes
          FROM proposal_files
          WHERE proposal_id::text IN (${sql.join(proposalIds.map((id: any) => sql`${id}`), sql`, `)})
        `);
        const rawFiles = Array.isArray(fileRows) ? fileRows : (fileRows as any).rows ?? [];
        for (const f of rawFiles) {
          if (!filesMap[f.proposal_id]) filesMap[f.proposal_id] = [];
          filesMap[f.proposal_id].push({
            id: f.id,
            storageKey: f.storage_key,
            originalFilename: f.original_filename,
            mimeType: f.mime_type,
            sizeBytes: Number(f.size_bytes),
          });
        }
      } catch (fileErr) {
        console.warn("[my-assignments] Failed to fetch proposal files metadata:", fileErr);
      }
    }

    // Fetch team members metadata (count + leader) safely
    const membersMap: Record<string, { count: number; leaderName?: string; leaderEmail?: string }> = {};
    if (teamIds.length > 0) {
      try {
        const tmRows = await db.execute(sql`
          SELECT
            tm.team_id,
            COUNT(*)::int AS member_count,
            MAX(CASE WHEN tm.role = 'LEADER' THEN pr.full_name END) AS leader_name,
            MAX(CASE WHEN tm.role = 'LEADER' THEN pr.email END) AS leader_email
          FROM team_members tm
          JOIN profiles pr ON pr.id = tm.user_id
          WHERE tm.team_id::text IN (${sql.join(teamIds.map((id: any) => sql`${id}`), sql`, `)})
            AND tm.status = 'ACTIVE'
          GROUP BY tm.team_id
        `);
        const rawTm = Array.isArray(tmRows) ? tmRows : (tmRows as any).rows ?? [];
        for (const tm of rawTm) {
          membersMap[tm.team_id] = {
            count: Number(tm.member_count),
            leaderName: tm.leader_name || undefined,
            leaderEmail: tm.leader_email || undefined,
          };
        }
      } catch (tmErr) {
        console.warn("[my-assignments] Failed to fetch team members metadata:", tmErr);
      }
    }

    // Check code freeze
    let isFrozen = false;
    let freezeConfig: any = null;
    try {
      freezeConfig = await db.query.systemConfig.findFirst({
        where: eq(schema.systemConfig.key, "submission_deadline"),
      });
      const deadline = freezeConfig ? new Date(freezeConfig.value) : null;
      isFrozen = deadline && !isNaN(deadline.getTime()) ? new Date() > deadline : false;
    } catch (_) {}

    const assignments = rawRows.map((row: any) => {
      const pFiles = row.proposal_id ? (filesMap[row.proposal_id] || []) : [];
      const mInfo = membersMap[row.team_id] || { count: 1 };

      return {
        id: row.assignment_id,
        judgeId: row.judge_id,
        teamId: row.team_id,
        assignedAt: row.assigned_at,
        team: {
          id: row.team_id,
          teamCode: row.team_code,
          teamName: row.team_name,
          category: row.category,
          status: row.team_status,
          originalRank: row.original_rank,
          memberCount: mInfo.count,
          leaderName: mInfo.leaderName || "Team Leader",
          leaderEmail: mInfo.leaderEmail || "",
          proposal: row.proposal_id
            ? {
                id: row.proposal_id,
                title: row.proposal_title,
                description: row.proposal_description,
                devpostUrl: row.devpost_url,
                files: pFiles,
              }
            : null,
        },
        score: row.score_id
          ? {
              id: row.score_id,
              technicalScore: Number(row.technical_score),
              problemScore: Number(row.problem_score),
              innovationScore: Number(row.innovation_score),
              marketScore: Number(row.market_score),
              documentScore: Number(row.document_score),
              finalScore: row.final_score,
              submittedAt: row.score_submitted_at,
              updatedAt: row.score_updated_at,
            }
          : null,
      };
    });

    res.json({
      success: true,
      data: {
        assignments,
        isFrozen,
        deadline: freezeConfig?.value ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all proposals for assigned teams (Judge)
 * GET /api/judges/proposals
 */
router.get("/proposals", requireAuth, requireRole("JUDGE"), async (req, res, next) => {
  try {
    const user = req.sessionUser!;

    const rows = await db.execute(sql`
      SELECT
        p.id AS proposal_id,
        p.title,
        p.description,
        p.devpost_url,
        ct.id AS team_id,
        ct.team_name,
        ct.team_code,
        ct.category,
        pf.storage_key,
        pf.original_filename
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      INNER JOIN judge_assignments ja ON ja.judge_id = j.id
      INNER JOIN competition_teams ct ON ct.id = ja.team_id
      INNER JOIN proposals p ON p.team_id = ct.id
      LEFT JOIN proposal_files pf ON pf.proposal_id = p.id
      WHERE (pr.id::text = ${user.profileId} OR pr.email = ${user.email})
        AND j.status = 'ACTIVE'
      ORDER BY ct.team_name ASC
    `);

    const rawRows = Array.isArray(rows) ? rows : (rows as any).rows ?? [];

    const proposals = rawRows.map((r: any) => ({
      id: r.proposal_id,
      teamId: r.team_id,
      teamName: r.team_name,
      teamCode: r.team_code,
      category: r.category,
      title: r.title,
      description: r.description,
      linkUrl: r.devpost_url,
      fileStorageKey: r.storage_key,
      filename: r.original_filename,
    }));

    res.json({
      success: true,
      data: { proposals },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Seed/Sync Proposal PDFs to storage (Admin/Judge system utility)
 * POST /api/judges/sync-dummy-pdfs
 */
router.post("/sync-dummy-pdfs", requireAuth, async (req, res, next) => {
  try {
    const allProposals = await db.execute(sql`
      SELECT p.id, p.title, p.team_id, ct.team_name, ct.team_code, ct.category
      FROM proposals p
      JOIN competition_teams ct ON ct.id = p.team_id
      ORDER BY ct.original_rank ASC
    `);

    const rawProposals = Array.isArray(allProposals) ? allProposals : (allProposals as any).rows ?? [];
    const tempDir = process.env.VERCEL ? "/tmp/uploads/temp" : path.join(process.cwd(), "uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let syncedCount = 0;
    for (let i = 0; i < rawProposals.length; i++) {
      const prop = rawProposals[i];
      const pdfBuffer = generateRichProposalPDF(
        prop.title || `Proposal Inovasi ${prop.team_name}`,
        prop.team_name,
        prop.team_code,
        prop.category || "NATIONAL",
        i
      );

      const pdfFilename = `dummy_${prop.team_code.replace(/-/g, "_").toLowerCase()}.pdf`;
      const tempPath = path.join(tempDir, pdfFilename);
      fs.writeFileSync(tempPath, pdfBuffer);

      let storageKey: string;
      try {
        storageKey = await uploadFileToStorage("proposals", tempPath, pdfFilename, "application/pdf");
      } catch (uploadErr) {
        console.warn(`[PDF Sync] Upload failed for ${prop.team_code}, using local key fallback`, uploadErr);
        storageKey = `proposals/${pdfFilename}`;
      }

      // Check existing proposal file
      const existing = await db.execute(sql`
        SELECT id FROM proposal_files WHERE proposal_id = ${prop.id} LIMIT 1
      `);
      const existingRows = Array.isArray(existing) ? existing : (existing as any).rows ?? [];

      if (existingRows.length > 0) {
        await db.execute(sql`
          UPDATE proposal_files
          SET storage_key = ${storageKey},
              original_filename = ${`proposal_${prop.team_code}.pdf`},
              mime_type = 'application/pdf',
              size_bytes = ${pdfBuffer.length}
          WHERE id = ${existingRows[0].id}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO proposal_files (id, proposal_id, storage_key, original_filename, mime_type, size_bytes)
          VALUES (${crypto.randomUUID()}, ${prop.id}, ${storageKey}, ${`proposal_${prop.team_code}.pdf`}, 'application/pdf', ${pdfBuffer.length})
        `);
      }
      syncedCount++;
    }

    res.json({
      success: true,
      message: `Successfully synced & uploaded ${syncedCount} dummy proposal PDFs to storage!`,
      data: { syncedCount },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Submit scores for an assigned team
 * POST /api/judges/submit-score
 */
router.post("/submit-score", requireAuth, requireRole("JUDGE"), async (req, res, next) => {
  try {
    const user = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid(),
      technicalScore: z.number().min(1).max(100),
      problemScore: z.number().min(1).max(100),
      innovationScore: z.number().min(1).max(100),
      marketScore: z.number().min(1).max(100),
      documentScore: z.number().min(1).max(100),
      notes: z.string().optional(),
    });

    const parsed = bodySchema.parse(req.body);

    // Code freeze check
    const freezeConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "submission_deadline"),
    });
    if (freezeConfig && new Date() > new Date(freezeConfig.value)) {
      throw new AppError(403, "Code freeze active — submission deadline has passed.", "CODE_FREEZE");
    }

    const result = await scoringService.submitScore(user.profileId, parsed.teamId, {
      technicalScore: parsed.technicalScore,
      problemScore: parsed.problemScore,
      innovationScore: parsed.innovationScore,
      marketScore: parsed.marketScore,
      documentScore: parsed.documentScore,
    });

    res.json({
      success: true,
      message: "Score submitted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN JUDGE MANAGEMENT (authenticated as ADMIN)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all judges with assignment counts
 * GET /api/judges
 */
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    // Single raw SQL with all aggregations — no N+1, no Drizzle relational ORM issues
    const rows = await db.execute(sql`
      SELECT
        j.id,
        j.status,
        pr.id          AS user_id,
        pr.full_name,
        pr.email,
        pr.avatar_url,
        pr.created_at  AS user_created_at,
        COALESCE(asgn.assigned_count, 0)::int AS assigned_team_count,
        COALESCE(scrd.scored_count,   0)::int AS scored_count
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS assigned_count
        FROM judge_assignments
        GROUP BY judge_id
      ) asgn ON asgn.judge_id = j.id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS scored_count
        FROM judge_scores
        GROUP BY judge_id
      ) scrd ON scrd.judge_id = j.id
      ORDER BY pr.full_name ASC
    `);

    const rawRows = Array.isArray(rows) ? rows : (rows as any).rows ?? [];

    const judges = rawRows.map((row: any) => ({
      id: row.id,
      status: row.status,
      userId: row.user_id,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        createdAt: row.user_created_at,
      },
      assignedTeamCount: Number(row.assigned_team_count),
      scoredCount: Number(row.scored_count),
    }));

    res.json({
      success: true,
      data: judges,
    });
  } catch (error) {
    next(error);
  }
});


/**
 * Add a judge (Admin only)
 * POST /api/judges/add
 */
router.post("/add", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
    });

    const { fullName, email } = bodySchema.parse(req.body);

    // Create or find profile
    let profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.email, email),
    });

    if (!profile) {
      [profile] = await db
        .insert(schema.profiles)
        .values({
          googleSub: `judge-${Date.now()}`,
          email,
          fullName,
          onboardingStatus: "COMPLETE",
        })
        .returning();
    }

    // Check if already a judge
    const existingJudge = await db.query.judges.findFirst({
      where: eq(schema.judges.userId, profile.id),
    });

    if (existingJudge) {
      if (existingJudge.status === "ACTIVE") {
        throw new AppError(400, "This person is already an active judge.");
      }
      // Reactivate
      await db.update(schema.judges)
        .set({ status: "ACTIVE" })
        .where(eq(schema.judges.id, existingJudge.id));

      await auditService.log(null, {
        actorId: admin.profileId,
        action: "JUDGE_REACTIVATED",
        entityType: "judge",
        entityId: existingJudge.id,
        metadata: { email, fullName },
      });

      res.json({ success: true, message: "Judge reactivated.", data: existingJudge });
      return;
    }

    // Assign JUDGE role
    await db.insert(schema.roleAssignments).values({
      userId: profile.id,
      role: "JUDGE",
      source: "admin_add",
    }).onConflictDoNothing();

    // Create judge record
    const [judge] = await db.insert(schema.judges).values({
      userId: profile.id,
      status: "ACTIVE",
    }).returning();

    await auditService.log(null, {
      actorId: admin.profileId,
      action: "JUDGE_ADDED",
      entityType: "judge",
      entityId: judge.id,
      metadata: { email, fullName },
    });

    res.json({
      success: true,
      message: "Judge added successfully.",
      data: judge,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Remove/deactivate a judge (Admin only)
 * POST /api/judges/remove
 */
router.post("/remove", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({ judgeId: z.string().uuid() });
    const { judgeId } = bodySchema.parse(req.body);

    await db.update(schema.judges)
      .set({ status: "INACTIVE" })
      .where(eq(schema.judges.id, judgeId));

    await auditService.log(null, {
      actorId: admin.profileId,
      action: "JUDGE_REMOVED",
      entityType: "judge",
      entityId: judgeId,
    });

    res.json({ success: true, message: "Judge deactivated." });
  } catch (error) {
    next(error);
  }
});

/**
 * Activate/reactivate a judge (Admin only)
 * POST /api/judges/activate
 */
router.post("/activate", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({ judgeId: z.string().uuid() });
    const { judgeId } = bodySchema.parse(req.body);

    await db.update(schema.judges)
      .set({ status: "ACTIVE" })
      .where(eq(schema.judges.id, judgeId));

    await auditService.log(null, {
      actorId: admin.profileId,
      action: "JUDGE_REACTIVATED",
      entityType: "judge",
      entityId: judgeId,
    });

    res.json({ success: true, message: "Judge reactivated." });
  } catch (error) {
    next(error);
  }
});

/**
 * Auto-assign judges to all teams using cross-judging algorithm
 * POST /api/judges/generate-phase-1
 *
 * Algorithm: Overlapping sets
 * - Each team is judged by exactly 2 judges
 * - Each judge handles ~N/judges*2 teams (overlapping windows)
 * - Example: 5 judges, 100 teams → each judge evaluates 40 teams
 *   Judge A: teams 1-40
 *   Judge B: teams 21-60
 *   Judge C: teams 41-80
 *   Judge D: teams 61-100
 *   Judge E: teams 81-100 + teams 1-20
 */
router.post("/generate-phase-1", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;

    // 1. Get all active judges (raw SQL, no Drizzle relational)
    const judgeRows = await db.execute(sql`
      SELECT j.id, pr.full_name
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      WHERE j.status = 'ACTIVE'
      ORDER BY j.id ASC
    `);
    const judges = (Array.isArray(judgeRows) ? judgeRows : (judgeRows as any).rows ?? []) as {
      id: string;
      full_name: string;
    }[];

    if (judges.length < 2) {
      throw new AppError(400, "At least 2 active judges are required for cross-judging.");
    }

    // 2. Get all teams ordered by rank (raw SQL)
    const teamRows = await db.execute(sql`
      SELECT id, team_code, team_name
      FROM competition_teams
      ORDER BY original_rank ASC
    `);
    const teams = (Array.isArray(teamRows) ? teamRows : (teamRows as any).rows ?? []) as {
      id: string;
      team_code: string;
      team_name: string;
    }[];

    if (teams.length === 0) {
      throw new AppError(400, "No teams found to assign.");
    }

    const nJudges = judges.length;
    const nTeams = teams.length;

    // 3. Generate balanced 2-judge cross-assignments using modular rotation
    const assignments: { judgeId: string; teamId: string }[] = [];
    const JUDGES_PER_TEAM = 2;

    for (let i = 0; i < nTeams; i++) {
      const teamId = teams[i].id;
      for (let k = 0; k < JUDGES_PER_TEAM; k++) {
        const judgeIdx = (i + k) % nJudges;
        assignments.push({ judgeId: judges[judgeIdx].id, teamId });
      }
    }

    // 4. Deduplicate assignments
    const seen = new Set<string>();
    const uniqueAssignments = assignments.filter((a) => {
      const key = `${a.judgeId}:${a.teamId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 5. Clear old assignments
    await db.execute(sql`DELETE FROM judge_assignments`);

    // 6. Bulk insert new assignments (batches of 100 via raw SQL to avoid UUID binding issues)
    for (let i = 0; i < uniqueAssignments.length; i += 100) {
      const batch = uniqueAssignments.slice(i, i + 100);
      const valueClauses = batch.map(
        (a) => sql`(${a.judgeId}::uuid, ${a.teamId}::uuid, NOW())`
      );
      await db.execute(
        sql`INSERT INTO judge_assignments (judge_id, team_id, assigned_at) VALUES ${sql.join(valueClauses, sql`, `)}`
      );
    }

    // 7. Update competition phase via upsert
    await db.execute(sql`
      INSERT INTO system_config (key, value, type, updated_at)
      VALUES ('competition_phase', '1', 'STRING', NOW())
      ON CONFLICT (key) DO UPDATE SET value = '1', updated_at = NOW()
    `);

    // 8. Audit log
    await auditService.log(null, {
      actorId: admin.profileId,
      action: "PHASE1_JUDGING_GENERATED",
      entityType: "system",
      entityId: "phase-1",
      metadata: {
        judgeCount: nJudges,
        teamCount: nTeams,
        assignmentCount: uniqueAssignments.length,
        judges: judges.map((j) => (j as any).full_name || j.id),
      },
    });

    // 9. Compute summary stats
    const summary = judges.map((j) => {
      const assigned = uniqueAssignments.filter((a) => a.judgeId === j.id);
      return {
        judgeId: j.id,
        judgeName: (j as any).full_name || "Unknown",
        assignedCount: assigned.length,
        teams: assigned.map((a) => a.teamId),
      };
    });

    res.json({
      success: true,
      message: `Phase 1 judging generated: ${uniqueAssignments.length} assignments across ${nJudges} judges and ${nTeams} teams.`,
      data: {
        assignments: uniqueAssignments.length,
        judges: summary,
      },
    });
  } catch (error) {
    next(error);
  }
});


/**
 * Get assignment matrix overview (Admin)
 * GET /api/judges/assignment-matrix
 *
 * Fully raw SQL — eliminates Drizzle relational ORM issues in production.
 */
router.get("/assignment-matrix", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    // 1. Judge summary with aggregated counts
    const judgeMatrixRows = await db.execute(sql`
      SELECT
        j.id               AS judge_id,
        j.status,
        pr.full_name       AS judge_name,
        pr.email           AS judge_email,
        COALESCE(asgn.assigned_count, 0)::int AS assigned_count,
        COALESCE(scrd.scored_count,   0)::int AS scored_count
      FROM judges j
      INNER JOIN profiles pr ON pr.id = j.user_id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS assigned_count
        FROM judge_assignments
        GROUP BY judge_id
      ) asgn ON asgn.judge_id = j.id
      LEFT JOIN (
        SELECT judge_id, COUNT(*) AS scored_count
        FROM judge_scores
        GROUP BY judge_id
      ) scrd ON scrd.judge_id = j.id
      WHERE j.status = 'ACTIVE'
      ORDER BY pr.full_name ASC
    `);
    const judgeMatrixRaw = Array.isArray(judgeMatrixRows)
      ? judgeMatrixRows
      : (judgeMatrixRows as any).rows ?? [];

    // 2. Team matrix with aggregated judge/score counts
    const teamMatrixRows = await db.execute(sql`
      SELECT
        ct.id              AS team_id,
        ct.team_code,
        ct.team_name,
        ct.category,
        ct.original_rank,
        COUNT(DISTINCT ja.id)::int  AS judge_count,
        COUNT(DISTINCT js.id)::int  AS score_count
      FROM competition_teams ct
      LEFT JOIN judge_assignments ja ON ja.team_id = ct.id
      LEFT JOIN judge_scores js      ON js.team_id  = ct.id
      GROUP BY ct.id, ct.team_code, ct.team_name, ct.category, ct.original_rank
      ORDER BY ct.original_rank ASC
    `);
    const teamMatrixRaw = Array.isArray(teamMatrixRows)
      ? teamMatrixRows
      : (teamMatrixRows as any).rows ?? [];

    // 3. Per-team judge detail (which judge has scored which team)
    const teamJudgeDetailRows = await db.execute(sql`
      SELECT
        ja.team_id,
        ja.judge_id,
        pr.full_name       AS judge_name,
        js.final_score,
        CASE WHEN js.id IS NOT NULL THEN true ELSE false END AS has_scored
      FROM judge_assignments ja
      INNER JOIN judges j     ON j.id  = ja.judge_id
      INNER JOIN profiles pr  ON pr.id = j.user_id
      LEFT JOIN judge_scores js
             ON js.judge_id = ja.judge_id
            AND js.team_id  = ja.team_id
      ORDER BY ja.team_id, pr.full_name
    `);
    const teamJudgeDetailRaw = Array.isArray(teamJudgeDetailRows)
      ? teamJudgeDetailRows
      : (teamJudgeDetailRows as any).rows ?? [];

    // Build lookup: teamId -> array of judge details
    const teamJudgeMap = new Map<string, any[]>();
    for (const row of teamJudgeDetailRaw as any[]) {
      const entry = {
        judgeId: row.judge_id,
        judgeName: row.judge_name,
        hasScored: row.has_scored === true || row.has_scored === "true",
        finalScore: row.final_score ?? null,
      };
      if (!teamJudgeMap.has(row.team_id)) teamJudgeMap.set(row.team_id, []);
      teamJudgeMap.get(row.team_id)!.push(entry);
    }

    const matrix = (judgeMatrixRaw as any[]).map((row) => ({
      judgeId: row.judge_id,
      judgeName: row.judge_name,
      judgeEmail: row.judge_email,
      assignedCount: Number(row.assigned_count),
      scoredCount: Number(row.scored_count),
    }));

    const teamMatrix = (teamMatrixRaw as any[]).map((row) => ({
      teamId: row.team_id,
      teamCode: row.team_code,
      teamName: row.team_name,
      category: row.category,
      rank: Number(row.original_rank),
      judgeCount: Number(row.judge_count),
      scoreCount: Number(row.score_count),
      judges: teamJudgeMap.get(row.team_id) ?? [],
    }));

    res.json({
      success: true,
      data: { judges: matrix, teams: teamMatrix },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get leaderboard (Admin)
 * GET /api/judges/leaderboard
 */
router.get("/leaderboard", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const leaderboard = await scoringService.getLeaderboard();

    // Single query for both counts
    const progressRows = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM judge_assignments)::int AS total_assignments,
        (SELECT COUNT(*) FROM judge_scores)::int      AS total_scores
    `);
    const progressRaw = Array.isArray(progressRows)
      ? progressRows[0]
      : ((progressRows as any).rows ?? [])[0] ?? {};

    const totalAssignments = Number(progressRaw?.total_assignments ?? 0);
    const totalScores = Number(progressRaw?.total_scores ?? 0);
    const progress = {
      totalAssignments,
      totalScores,
      percentage: totalAssignments > 0
        ? Math.round((totalScores / totalAssignments) * 100)
        : 0,
    };

    res.json({
      success: true,
      data: { leaderboard, progress },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

