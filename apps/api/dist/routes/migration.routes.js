import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { db, schema } from "@compsphere/db";
import { eq, and, sql } from "drizzle-orm";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { generateToken, hashToken } from "../lib/crypto.js";
import { AppError } from "../middleware/error.middleware.js";
import { auditService } from "../services/audit.service.js";
import { z } from "zod";
import { sseService } from "../sse/sse.service.js";
import { uploadFileToStorage } from "../lib/storage.js";
const router = Router();
const upload = multer({ dest: "uploads/temp/" });
// Secure all migration routes
router.use(requireAuth, requireRole("ADMIN"));
/**
 * Upload and preview migration CSV
 * POST /api/migration/upload
 */
router.post("/upload", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError(400, "CSV file is required.");
        }
        const content = fs.readFileSync(req.file.path, "utf-8");
        const lines = content.split(/\r?\n/);
        const headers = lines[0].split(",");
        // Simple robust CSV parser for MVP (split by comma, clean quotes)
        const rows = [];
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
            // Map columns: teamName, teamCode, rank, category, countryMix, propTitle, propDesc, devpostUrl
            if (cols.length < 5) {
                errors.push(`Line ${i + 1}: Insufficient columns (got ${cols.length}, expected at least 5)`);
                continue;
            }
            const teamName = cols[0];
            const teamCode = cols[1];
            const rank = parseInt(cols[2], 10);
            const categoryRaw = cols[3]?.toUpperCase();
            const countryMix = cols[4] || null;
            const proposalTitle = cols[5] || `Proposal for ${teamName}`;
            const proposalDescription = cols[6] || "";
            const devpostUrl = cols[7] || null;
            if (!teamName || !teamCode || isNaN(rank)) {
                errors.push(`Line ${i + 1}: Missing critical fields (team name, code, or rank)`);
                continue;
            }
            if (categoryRaw !== "NATIONAL" && categoryRaw !== "MIX" && categoryRaw !== "INTERNATIONAL") {
                errors.push(`Line ${i + 1}: Invalid category "${categoryRaw}"`);
                continue;
            }
            rows.push({
                teamName,
                teamCode,
                originalRank: rank,
                category: categoryRaw,
                countryMix,
                proposalTitle,
                proposalDescription,
                devpostUrl,
            });
        }
        // Clean temp file
        fs.unlinkSync(req.file.path);
        res.json({
            success: true,
            data: {
                fileName: req.file.originalname,
                rowCount: rows.length,
                preview: rows.slice(0, 10), // return first 10 for preview
                errors,
                isValid: errors.length === 0,
            },
        });
    }
    catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});
/**
 * Commit a migration batch
 * POST /api/migration/commit
 */
router.post("/commit", async (req, res, next) => {
    try {
        const admin = req.sessionUser;
        const bodySchema = z.object({
            fileName: z.string(),
            rows: z.array(z.object({
                teamName: z.string(),
                teamCode: z.string(),
                originalRank: z.number(),
                category: z.enum(["NATIONAL", "MIX", "INTERNATIONAL"]),
                countryMix: z.string().optional().nullable(),
                proposalTitle: z.string(),
                proposalDescription: z.string().optional().nullable(),
                devpostUrl: z.string().optional().nullable(),
            })),
        });
        const parsed = bodySchema.parse(req.body);
        const result = await db.transaction(async (tx) => {
            // Create migration batch record
            const [batch] = await tx
                .insert(schema.migrationBatches)
                .values({
                source: "DEVPOST",
                fileName: parsed.fileName,
                rowCount: parsed.rows.length,
                status: "PENDING",
                createdBy: admin.profileId,
            })
                .returning();
            const tokensGenerated = [];
            for (const row of parsed.rows) {
                const paymentRequired = row.category !== "INTERNATIONAL";
                const paymentAmount = paymentRequired ? 120000 : 0;
                // Upsert team
                const [team] = await tx
                    .insert(schema.competitionTeams)
                    .values({
                    teamCode: row.teamCode,
                    teamName: row.teamName,
                    category: row.category,
                    countryMix: row.countryMix,
                    originalRank: row.originalRank,
                    status: "NEW",
                    paymentRequired,
                    paymentAmount,
                })
                    .onConflictDoUpdate({
                    target: schema.competitionTeams.teamCode,
                    set: {
                        teamName: row.teamName,
                        category: row.category,
                        originalRank: row.originalRank,
                        paymentRequired,
                        paymentAmount,
                    },
                })
                    .returning();
                // Upsert proposal
                await tx
                    .insert(schema.proposals)
                    .values({
                    teamId: team.id,
                    title: row.proposalTitle,
                    description: row.proposalDescription,
                    source: "DEVPOST",
                    devpostUrl: row.devpostUrl,
                })
                    .onConflictDoNothing(); // Skip if exists
                // Generate Team Activation Token if Top 30
                if (row.originalRank <= 30) {
                    const rawToken = generateToken(32);
                    const tokenHash = hashToken(rawToken);
                    // Delete existing issued tokens to prevent duplication
                    await tx
                        .delete(schema.teamAccessTokens)
                        .where(and(eq(schema.teamAccessTokens.teamId, team.id), eq(schema.teamAccessTokens.status, "ISSUED")));
                    await tx.insert(schema.teamAccessTokens).values({
                        teamId: team.id,
                        tokenHash,
                        status: "ISSUED",
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    });
                    tokensGenerated.push({
                        teamCode: row.teamCode,
                        token: rawToken,
                    });
                }
            }
            // Mark batch completed
            await tx
                .update(schema.migrationBatches)
                .set({
                status: "COMPLETED",
                completedAt: new Date(),
            })
                .where(eq(schema.migrationBatches.id, batch.id));
            await auditService.log(tx, {
                actorId: admin.profileId,
                action: "MIGRATION_BATCH_COMMITTED",
                entityType: "migration_batch",
                entityId: batch.id,
                metadata: { fileName: parsed.fileName, rowCount: parsed.rows.length },
            });
            return { batchId: batch.id, tokens: tokensGenerated };
        });
        res.json({
            success: true,
            message: "Migration completed and Top 30 activation tokens generated successfully.",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * List all issued tokens for administrative review/export
 * GET /api/migration/tokens
 */
router.get("/tokens", async (req, res, next) => {
    try {
        const list = await db.execute(sql `
      SELECT
        ct.team_code,
        ct.team_name,
        ct.original_rank,
        ct.category,
        tat.status,
        tat.activated_at
      FROM team_access_tokens tat
      JOIN competition_teams ct ON tat.team_id = ct.id
      ORDER BY ct.original_rank ASC
    `);
        res.json({
            success: true,
            data: list.rows,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Extract proposal title from an uploaded PDF
 * POST /api/migration/extract-title
 */
router.post("/extract-title", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError(400, "PDF file is required.");
        }
        if (req.file.mimetype !== "application/pdf") {
            fs.unlinkSync(req.file.path);
            throw new AppError(400, "Only PDF files are allowed.");
        }
        const fileBuffer = fs.readFileSync(req.file.path);
        const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
        const textResult = await parser.getText();
        await parser.destroy();
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        // Extract title from first page text
        const text = textResult.text || "";
        let extractedTitle = "";
        // Strategy 1: Look for common title patterns in first 500 chars
        const firstChunk = text.substring(0, 500).trim();
        const lines = firstChunk.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
            // The first meaningful line is typically the title
            // Skip lines that look like headers, page numbers, or metadata
            for (const line of lines) {
                const cleaned = line.trim();
                // Skip very short lines (likely page numbers or markers)
                if (cleaned.length < 3)
                    continue;
                // Skip lines that look like metadata
                if (/^(page|halaman|abstract|abstrak|daftar|kata kunci|kata\s+kunci)/i.test(cleaned))
                    continue;
                if (/^\d+$/.test(cleaned))
                    continue;
                // Skip lines that look like institutional headers
                if (/^(universitas|institut|sekolah|fakultas|jurusan|program)/i.test(cleaned))
                    continue;
                // Use this line as the title
                extractedTitle = cleaned;
                break;
            }
        }
        // Strategy 2: If no good title found, use first non-empty line
        if (!extractedTitle && lines.length > 0) {
            extractedTitle = lines[0];
        }
        // Fallback: use filename
        if (!extractedTitle) {
            extractedTitle = path.parse(req.file.originalname).name.replace(/[_-]/g, " ");
        }
        // Clean up: limit length to 200 chars, remove excessive whitespace
        extractedTitle = extractedTitle.replace(/\s+/g, " ").trim().substring(0, 200);
        res.json({
            success: true,
            data: { title: extractedTitle },
        });
    }
    catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});
/**
 * Manually register/migrate a team with members and proposal PDF
 * POST /api/migration/submit-team
 */
router.post("/submit-team", upload.single("proposalFile"), async (req, res, next) => {
    try {
        const admin = req.sessionUser;
        // Parse fields — proposalTitle is now auto-derived from PDF if not provided
        const { teamName, category, proposalTitle: rawProposalTitle, proposalDescription, devpostUrl, members: membersRaw } = req.body;
        if (!teamName || !category || !membersRaw) {
            throw new AppError(400, "Missing required team details or member details.");
        }
        if (!req.file) {
            throw new AppError(400, "Proposal PDF file is required.");
        }
        if (req.file.mimetype !== "application/pdf") {
            // Remove temp file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            throw new AppError(400, "Only PDF files are allowed.");
        }
        // Auto-extract proposal title from PDF if not provided or empty
        let proposalTitle = rawProposalTitle;
        if (!proposalTitle || !proposalTitle.trim()) {
            try {
                const fileBuffer = fs.readFileSync(req.file.path);
                const innerParser = new PDFParse({ data: new Uint8Array(fileBuffer) });
                const innerResult = await innerParser.getText();
                await innerParser.destroy();
                const text = innerResult.text || "";
                const firstChunk = text.substring(0, 500).trim();
                const lines = firstChunk.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
                for (const line of lines) {
                    const cleaned = line.trim();
                    if (cleaned.length < 3)
                        continue;
                    if (/^(page|halaman|abstract|abstrak|daftar|kata kunci|kata\s+kunci)/i.test(cleaned))
                        continue;
                    if (/^\d+$/.test(cleaned))
                        continue;
                    if (/^(universitas|institut|sekolah|fakultas|jurusan|program)/i.test(cleaned))
                        continue;
                    proposalTitle = cleaned;
                    break;
                }
                if (!proposalTitle && lines.length > 0) {
                    proposalTitle = lines[0];
                }
                if (!proposalTitle) {
                    proposalTitle = path.parse(req.file.originalname).name.replace(/[_-]/g, " ");
                }
                proposalTitle = proposalTitle.replace(/\s+/g, " ").trim().substring(0, 200);
            }
            catch {
                proposalTitle = path.parse(req.file.originalname).name.replace(/[_-]/g, " ");
            }
        }
        const members = JSON.parse(membersRaw);
        if (!Array.isArray(members) || members.length < 1 || members.length > 3) {
            throw new AppError(400, "Between 1 and 3 team members are allowed.");
        }
        for (const member of members) {
            if (!member.fullName || !member.email) {
                throw new AppError(400, "Each member must have a name and email.");
            }
        }
        const uppercaseCategory = category.toUpperCase();
        if (uppercaseCategory !== "NATIONAL" && uppercaseCategory !== "MIX" && uppercaseCategory !== "INTERNATIONAL") {
            throw new AppError(400, "Invalid category option.");
        }
        // Move file to permanent storage: apps/api/uploads/proposals/ (dynamically)
        let storageKey;
        const newFilename = `${req.file.filename}.pdf`;
        if (process.env.STORAGE_PROVIDER === "supabase") {
            storageKey = await uploadFileToStorage("proposals", req.file.path, newFilename, req.file.mimetype);
        }
        else {
            const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "../../../uploads");
            const proposalsDir = path.join(uploadsDir, "proposals");
            fs.mkdirSync(proposalsDir, { recursive: true });
            const targetPath = path.join(proposalsDir, newFilename);
            fs.renameSync(req.file.path, targetPath);
            storageKey = `proposals/${newFilename}`;
        }
        const result = await db.transaction(async (tx) => {
            // 1. Calculate next rank
            const maxRankResult = await tx.select({ maxRank: sql `max(original_rank)` }).from(schema.competitionTeams);
            const nextRank = (maxRankResult[0]?.maxRank ?? 0) + 1;
            const nextTeamCode = `CS26-${String(nextRank).padStart(3, "0")}`;
            const paymentRequired = uppercaseCategory !== "INTERNATIONAL";
            const paymentAmount = paymentRequired ? 120000 : 0;
            // 2. Create team
            const [team] = await tx
                .insert(schema.competitionTeams)
                .values({
                teamCode: nextTeamCode,
                teamName: teamName,
                category: uppercaseCategory,
                originalRank: nextRank,
                status: "NEW",
                paymentRequired,
                paymentAmount,
            })
                .returning();
            // 3. Create proposal (title auto-derived from PDF)
            const [proposal] = await tx
                .insert(schema.proposals)
                .values({
                teamId: team.id,
                title: proposalTitle,
                description: proposalDescription || "",
                source: "MANUAL",
                devpostUrl: devpostUrl || null,
            })
                .returning();
            // 4. Create proposal file record
            await tx
                .insert(schema.proposalFiles)
                .values({
                proposalId: proposal.id,
                storageKey: storageKey,
                originalFilename: req.file.originalname,
                mimeType: req.file.mimetype,
                sizeBytes: req.file.size,
            });
            // 5. Create profiles & link to team
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                const targetEmail = member.email.toLowerCase().trim();
                console.log(`[submit-team] Processing member ${i + 1}/${members.length}:`, member.fullName, targetEmail);
                let profile = await tx.query.profiles.findFirst({
                    where: eq(schema.profiles.email, targetEmail),
                });
                console.log(`[submit-team] Existing profile for ${targetEmail}:`, profile ? profile.id : "NOT FOUND");
                if (!profile) {
                    [profile] = await tx
                        .insert(schema.profiles)
                        .values({
                        googleSub: `manual_${crypto.randomUUID()}`,
                        email: targetEmail,
                        fullName: member.fullName,
                        preferredRole: "PARTICIPANT",
                        onboardingStatus: "COMPLETE",
                    })
                        .returning();
                    console.log(`[submit-team] Created new profile:`, profile.id, profile.email);
                }
                // Check if already in a team
                const existingMembership = await tx.query.teamMembers.findFirst({
                    where: and(eq(schema.teamMembers.userId, profile.id), eq(schema.teamMembers.status, "ACTIVE")),
                });
                console.log(`[submit-team] Existing membership for ${profile.id}:`, existingMembership ? "FOUND (skipping)" : "NONE (will create)");
                if (!existingMembership) {
                    await tx.insert(schema.teamMembers).values({
                        teamId: team.id,
                        userId: profile.id,
                        role: i === 0 ? "TEAM_LEADER" : "TEAM_MEMBER",
                        status: "ACTIVE",
                        verifiedAt: new Date(),
                    });
                    console.log(`[submit-team] Created team_member: team=${team.id} user=${profile.id} role=${i === 0 ? "TEAM_LEADER" : "TEAM_MEMBER"}`);
                }
            }
            // 6. Generate activation token
            const rawToken = generateToken(32);
            const tokenHash = hashToken(rawToken);
            await tx.insert(schema.teamAccessTokens).values({
                teamId: team.id,
                tokenHash,
                status: "ISSUED",
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });
            // 7. Create migration batch
            const [batch] = await tx
                .insert(schema.migrationBatches)
                .values({
                source: "MANUAL",
                fileName: `manual_registration_${teamName}`,
                rowCount: 1,
                status: "COMPLETED",
                completedAt: new Date(),
                createdBy: admin.profileId,
            })
                .returning();
            await auditService.log(tx, {
                actorId: admin.profileId,
                action: "MIGRATION_BATCH_COMMITTED",
                entityType: "migration_batch",
                entityId: batch.id,
                metadata: { fileName: `manual_registration_${teamName}`, rowCount: 1 },
            });
            return { team, token: rawToken };
        });
        // Broadcast real-time update to all admin clients
        sseService.broadcast("migration:team_added", {
            teamCode: result.team.teamCode,
            teamName: result.team.teamName,
            category: result.team.category,
            originalRank: result.team.originalRank,
            status: result.team.status,
            createdAt: new Date().toISOString(),
        });
        res.json({
            success: true,
            message: "Team manually migrated successfully.",
            data: result,
        });
    }
    catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});
/**
 * List recently migrated teams (latest 15)
 * GET /api/migration/recent-teams
 */
router.get("/recent-teams", async (req, res, next) => {
    try {
        const list = await db.execute(sql `
      SELECT
        ct.id,
        ct.team_code,
        ct.team_name,
        ct.category,
        ct.original_rank,
        ct.status,
        ct.created_at,
        COUNT(tm.id)::int AS member_count,
        p.title AS proposal_title
      FROM competition_teams ct
      LEFT JOIN team_members tm ON tm.team_id = ct.id AND tm.status = 'ACTIVE'
      LEFT JOIN proposals p ON p.team_id = ct.id
      GROUP BY ct.id, p.title
      ORDER BY ct.created_at DESC
      LIMIT 15
    `);
        res.json({
            success: true,
            data: list.rows,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=migration.routes.js.map