import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { battleRoyaleService } from "../services/battleRoyale.service";
import { scoringService } from "../services/scoring.service";
import { auditService } from "../services/audit.service";
import { emailService } from "../services/email.service";
import { sseService } from "../sse/sse.service";
import { db, schema } from "@compsphere/db";
import { eq, sql, inArray } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/**
 * Helper to get slot confirmations and email logs from system_config
 */
async function getConfirmationAndEmailMaps() {
  const [confirmConfig, emailLogsConfig] = await Promise.all([
    db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "phase1_slot_confirmations"),
    }),
    db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "phase1_email_logs"),
    }),
  ]);

  let confirmations: Record<string, { decision: "CONFIRMED" | "REJECTED"; updatedAt: string; notes?: string }> = {};
  if (confirmConfig?.value) {
    try {
      confirmations = JSON.parse(confirmConfig.value);
    } catch {
      confirmations = {};
    }
  }

  let emailLogs: Record<string, { lastSentAt: string; emailType: string; subject: string }> = {};
  if (emailLogsConfig?.value) {
    try {
      emailLogs = JSON.parse(emailLogsConfig.value);
    } catch {
      emailLogs = {};
    }
  }

  return { confirmations, emailLogs };
}

/**
 * Get current Battle Royale status and remaining slots
 * GET /api/battle-royale/status
 */
router.get("/status", async (req, res, next) => {
  try {
    const status = await battleRoyaleService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Battle Royale slots
 * GET /api/battle-royale/slots
 */
router.get("/slots", async (req, res, next) => {
  try {
    const status = await battleRoyaleService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Phase 1 Leaderboard with email & slot confirmation metadata (Admin only)
 * GET /api/battle-royale/phase1-leaderboard
 */
router.get("/phase1-leaderboard", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const liveLeaderboard = await scoringService.getLeaderboard();
    const liveMap = new Map<string, any>();
    for (const team of liveLeaderboard) {
      liveMap.set(team.team_id, team);
    }

    // Check if snapshot exists in system_config
    const snapshotConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "phase1_leaderboard"),
    });

    const { confirmations, emailLogs } = await getConfirmationAndEmailMaps();

    // Fetch team leaders for all teams in one query safely
    const leaderMap = new Map<string, { name: string; email: string }>();
    try {
      const teamLeaderRows = await db.execute(sql`
        SELECT
          tm.team_id,
          pr.full_name AS leader_name,
          pr.email AS leader_email
        FROM team_members tm
        JOIN profiles pr ON pr.id = tm.user_id
        WHERE tm.role::text IN ('TEAM_LEADER', 'LEADER')
          AND tm.status::text = 'ACTIVE'
      `);
      const rawLeaders = Array.isArray(teamLeaderRows) ? teamLeaderRows : (teamLeaderRows as any).rows ?? [];
      for (const row of rawLeaders) {
        leaderMap.set(row.team_id, {
          name: row.leader_name || "Team Leader",
          email: row.leader_email || "",
        });
      }
    } catch (leaderErr) {
      console.warn("[phase1-leaderboard] Failed to query team leaders:", leaderErr);
    }

    let leaderboard: any[] = [];

    if (snapshotConfig?.value) {
      try {
        const parsed = JSON.parse(snapshotConfig.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-hydrate snapshot items with live payment, slot, leader, and email confirmation status
          leaderboard = parsed.map((item: any) => {
            const live = liveMap.get(item.team_id);
            const leader = leaderMap.get(item.team_id);
            const conf = confirmations[item.team_id];
            const emailLog = emailLogs[item.team_id];

            let emailStatus: "NOT_SENT" | "SENT" | "CONFIRMED" | "REJECTED" = "NOT_SENT";
            if (conf?.decision === "CONFIRMED") {
              emailStatus = "CONFIRMED";
            } else if (conf?.decision === "REJECTED") {
              emailStatus = "REJECTED";
            } else if (emailLog) {
              emailStatus = "SENT";
            }

            return {
              ...item,
              team_status: live?.team_status ?? item.team_status,
              payment_status: live?.payment_status ?? item.payment_status ?? "UNPAID",
              payment_amount: live?.payment_amount ?? item.payment_amount ?? null,
              slot_id: live?.slot_id ?? item.slot_id ?? null,
              slot_claimed_at: live?.slot_claimed_at ?? item.slot_claimed_at ?? null,
              is_payment_cleared:
                live?.is_payment_cleared ??
                (item.category === "INTERNATIONAL" ||
                  item.payment_status === "VERIFIED" ||
                  item.payment_status === "APPROVED"),
              leader_name: leader?.name || item.leader_name || "Team Leader",
              leader_email: leader?.email || item.leader_email || "",
              email_status: emailStatus,
              email_sent_at: emailLog?.lastSentAt || null,
              slot_decision: conf?.decision || null,
              slot_decided_at: conf?.updatedAt || null,
            };
          });

          // Also check if any live teams are not in the snapshot, append them
          for (const team of liveLeaderboard) {
            if (!leaderboard.some((t) => t.team_id === team.team_id)) {
              const leader = leaderMap.get(team.team_id);
              const conf = confirmations[team.team_id];
              const emailLog = emailLogs[team.team_id];
              leaderboard.push({
                ...team,
                leader_name: leader?.name || "Team Leader",
                leader_email: leader?.email || "",
                email_status: conf?.decision || (emailLog ? "SENT" : "NOT_SENT"),
                email_sent_at: emailLog?.lastSentAt || null,
                slot_decision: conf?.decision || null,
                slot_decided_at: conf?.updatedAt || null,
              });
            }
          }
        }
      } catch {
        leaderboard = [];
      }
    }

    // If no snapshot exists yet, fallback to live calculation
    if (!leaderboard || leaderboard.length === 0) {
      leaderboard = liveLeaderboard.map((team: any) => {
        const leader = leaderMap.get(team.team_id);
        const conf = confirmations[team.team_id];
        const emailLog = emailLogs[team.team_id];
        return {
          ...team,
          leader_name: leader?.name || "Team Leader",
          leader_email: leader?.email || "",
          email_status: conf?.decision || (emailLog ? "SENT" : "NOT_SENT"),
          email_sent_at: emailLog?.lastSentAt || null,
          slot_decision: conf?.decision || null,
          slot_decided_at: conf?.updatedAt || null,
        };
      });
    }

    // Check if phase 1 is closed
    const isClosedConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "judging_phase_1_closed"),
    });
    const isClosed = isClosedConfig?.value === "true";

    res.json({
      success: true,
      data: {
        isClosed,
        isEmailConfigured: emailService.isConfigured(),
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Reorder Phase 1 Leaderboard for Battle Royale (Admin only)
 * POST /api/battle-royale/reorder-leaderboard
 */
router.post("/reorder-leaderboard", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      leaderboard: z.array(z.any()),
    });

    const { leaderboard } = bodySchema.parse(req.body);

    await db.transaction(async (tx) => {
      await tx
        .insert(schema.systemConfig)
        .values({
          key: "phase1_leaderboard",
          value: JSON.stringify(leaderboard),
          type: "STRING",
          updatedAt: new Date(),
          updatedBy: admin.profileId,
        })
        .onConflictDoUpdate({
          target: schema.systemConfig.key,
          set: {
            value: JSON.stringify(leaderboard),
            updatedAt: new Date(),
            updatedBy: admin.profileId,
          },
        });

      await auditService.log(tx, {
        actorId: admin.profileId,
        action: "LEADERBOARD_REORDERED",
        entityType: "battle_royale",
        entityId: "leaderboard",
        metadata: { totalTeams: leaderboard.length },
      });
    });

    res.json({
      success: true,
      message: "Leaderboard order updated successfully.",
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Open the waiting-list claiming phase (Admin only)
 * POST /api/battle-royale/initiate
 */
router.post("/initiate", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const config = await battleRoyaleService.initiate(admin.profileId);
    res.json({
      success: true,
      message: "Battle Royale initiated successfully.",
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Claim a Battle Royale slot atomically (First Come First Served)
 * POST /api/battle-royale/claim
 */
router.post("/claim", requireAuth, async (req, res, next) => {
  try {
    const user = req.sessionUser!;
    const bodySchema = z.object({
      teamId: z.string().uuid("Invalid team ID"),
    });

    const { teamId } = bodySchema.parse(req.body);

    const result = await battleRoyaleService.claimSlot(teamId, user.profileId);

    res.json({
      success: true,
      message: "Successfully claimed a Battle Royale slot!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify Action Token for Slot Claim / Reject Response (Public)
 * GET /api/battle-royale/verify-token
 */
router.get("/verify-token", async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const verified = emailService.verifyToken(token);
    if (!verified.valid || !verified.teamId) {
      return res.status(400).json({
        success: false,
        expired: verified.expired || false,
        message: verified.expired ? "This action link has expired." : "Invalid or corrupted security token.",
      });
    }

    // Fetch team details
    const team = await db.query.competitionTeams.findFirst({
      where: eq(schema.competitionTeams.id, verified.teamId),
    });

    if (!team) {
      return res.status(404).json({ success: false, message: "Team record not found." });
    }

    const { confirmations } = await getConfirmationAndEmailMaps();
    const existingDecision = confirmations[team.id] || null;

    res.json({
      success: true,
      data: {
        teamId: team.id,
        teamName: team.teamName,
        teamCode: team.teamCode,
        category: team.category,
        originalRank: team.originalRank,
        status: team.status,
        defaultAction: verified.action,
        existingDecision,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Submit Slot Response (Claim / Confirm or Reject) via Token (Public)
 * POST /api/battle-royale/respond-slot
 */
router.post("/respond-slot", async (req, res, next) => {
  try {
    const bodySchema = z.object({
      token: z.string().min(1, "Token is required"),
      decision: z.enum(["CLAIM", "REJECT"]),
      notes: z.string().optional(),
    });

    const { token, decision, notes } = bodySchema.parse(req.body);

    const verified = emailService.verifyToken(token);
    if (!verified.valid || !verified.teamId) {
      return res.status(400).json({
        success: false,
        message: verified.expired ? "This action link has expired." : "Invalid or tampered security token.",
      });
    }

    const team = await db.query.competitionTeams.findFirst({
      where: eq(schema.competitionTeams.id, verified.teamId),
    });

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    const decisionRecord = {
      decision: decision === "CLAIM" ? ("CONFIRMED" as const) : ("REJECTED" as const),
      updatedAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    // Update in system_config
    const { confirmations } = await getConfirmationAndEmailMaps();
    confirmations[team.id] = decisionRecord;

    await db.transaction(async (tx) => {
      // 1. Save updated confirmations map
      await tx
        .insert(schema.systemConfig)
        .values({
          key: "phase1_slot_confirmations",
          value: JSON.stringify(confirmations),
          type: "STRING",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.systemConfig.key,
          set: {
            value: JSON.stringify(confirmations),
            updatedAt: new Date(),
          },
        });

      // 2. Update competition_teams status
      if (decision === "CLAIM") {
        await tx
          .update(schema.competitionTeams)
          .set({
            status: "AWAITING_CONFIRMATION",
            updatedAt: new Date(),
          })
          .where(eq(schema.competitionTeams.id, team.id));

        // Insert notification
        await tx.insert(schema.notifications).values({
          teamId: team.id,
          type: "SLOT_CONFIRMED",
          title: "🎉 Phase 2 Slot Confirmed",
          message: `Your team has successfully confirmed its Phase 2 qualification slot!`,
        });
      } else {
        // REJECT
        await tx
          .update(schema.competitionTeams)
          .set({
            status: "DROPPED",
            updatedAt: new Date(),
          })
          .where(eq(schema.competitionTeams.id, team.id));

        // Free up slot in battle_royale_slots if it was occupied
        await tx
          .update(schema.battleRoyaleSlots)
          .set({
            claimedBy: null,
            claimedAt: null,
          })
          .where(eq(schema.battleRoyaleSlots.claimedBy, team.id));

        // Insert notification
        await tx.insert(schema.notifications).values({
          teamId: team.id,
          type: "SLOT_REJECTED",
          title: "Slot Declined",
          message: `Your team has declined the Phase 2 slot. The slot has been released to the next eligible team on the waiting list.`,
        });
      }

      // 3. Audit log
      await auditService.log(tx, {
        actorId: team.id,
        action: decision === "CLAIM" ? "PHASE2_SLOT_CONFIRMED" : "PHASE2_SLOT_REJECTED",
        entityType: "team",
        entityId: team.id,
        metadata: {
          decision,
          teamName: team.teamName,
          category: team.category,
        },
      });
    });

    // Broadcast SSE update
    sseService.broadcast("battle_royale:slot_updated", {
      type: "DECISION_UPDATED",
      teamId: team.id,
      decision: decisionRecord.decision,
    });

    res.json({
      success: true,
      message:
        decision === "CLAIM"
          ? "You have successfully confirmed your Phase 2 Slot!"
          : "You have declined the slot. The vacancy has been released to the waiting list.",
      data: {
        teamId: team.id,
        teamName: team.teamName,
        decision: decisionRecord.decision,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Send Bulky / Filtered Email to Team Leaders (Admin only)
 * POST /api/battle-royale/send-emails
 */
router.post("/send-emails", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const admin = req.sessionUser!;
    const bodySchema = z.object({
      recipientType: z.enum(["ALL", "TOP30", "WAITLIST", "CUSTOM"]),
      selectedTeamIds: z.array(z.string().uuid()).optional(),
      emailType: z.enum(["SLOT_CONFIRMATION", "GENERAL_INFO"]),
      subject: z.string().min(1, "Subject is required"),
      content: z.string().min(1, "Content is required"),
      deadlineHours: z.number().default(72),
      testEmailOverride: z.string().optional(),
    });

    const { recipientType, selectedTeamIds, emailType, subject, content, deadlineHours, testEmailOverride } =
      bodySchema.parse(req.body);

    // 1. Fetch current leaderboard to get correct ranks
    const liveLeaderboard = await scoringService.getLeaderboard();
    const liveMap = new Map<string, any>();
    for (const team of liveLeaderboard) {
      liveMap.set(team.team_id, team);
    }

    // Check if snapshot exists
    const snapshotConfig = await db.query.systemConfig.findFirst({
      where: eq(schema.systemConfig.key, "phase1_leaderboard"),
    });

    let fullList: any[] = [];
    if (snapshotConfig?.value) {
      try {
        const parsed = JSON.parse(snapshotConfig.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fullList = parsed;
        }
      } catch {
        fullList = [];
      }
    }
    if (fullList.length === 0) {
      fullList = liveLeaderboard;
    }

    // Assign 1-indexed ranks
    const rankedList = fullList.map((team, idx) => ({
      ...team,
      rank: idx + 1,
    }));

    // 2. Filter target teams according to recipientType
    let targetTeams: typeof rankedList = [];

    if (recipientType === "TOP30") {
      targetTeams = rankedList.filter((t) => t.rank <= 30);
    } else if (recipientType === "WAITLIST") {
      targetTeams = rankedList.filter((t) => t.rank > 30 && t.rank <= 100);
    } else if (recipientType === "CUSTOM" && Array.isArray(selectedTeamIds) && selectedTeamIds.length > 0) {
      targetTeams = rankedList.filter((t) => selectedTeamIds.includes(t.team_id));
    } else {
      // ALL
      targetTeams = rankedList;
    }

    if (targetTeams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No teams match the specified recipient criteria.",
      });
    }

    // 3. Fetch team leader contacts for target teams safely
    const targetIds = targetTeams.map((t) => t.team_id);
    const leaderMap = new Map<string, { name: string; email: string }>();
    if (targetIds.length > 0) {
      try {
        const leadersQuery = await db.execute(sql`
          SELECT
            tm.team_id,
            pr.full_name AS leader_name,
            pr.email AS leader_email
          FROM team_members tm
          JOIN profiles pr ON pr.id = tm.user_id
          WHERE tm.team_id::text IN (${sql.join(targetIds.map((id: any) => sql`${id}`), sql`, `)})
            AND tm.role::text IN ('TEAM_LEADER', 'LEADER')
            AND tm.status::text = 'ACTIVE'
        `);
        const rawLeaders = Array.isArray(leadersQuery) ? leadersQuery : (leadersQuery as any).rows ?? [];
        for (const row of rawLeaders) {
          leaderMap.set(row.team_id, {
            name: row.leader_name || "Team Leader",
            email: row.leader_email || "",
          });
        }
      } catch (leaderErr) {
        console.warn("[send-emails] Failed to query leaders:", leaderErr);
      }
    }

    // 4. Get and prepare email logs
    const { emailLogs } = await getConfirmationAndEmailMaps();
    const sentResults: any[] = [];
    const notificationsToInsert: any[] = [];
    const nowIso = new Date().toISOString();

    for (const team of targetTeams) {
      const leader = leaderMap.get(team.team_id);
      const actualLeaderEmail = leader?.email || team.leader_email || "";
      const recipientEmail = testEmailOverride?.trim() ? testEmailOverride.trim() : actualLeaderEmail;
      const recipientName = leader?.name || team.leader_name || team.team_name + " Leader";

      const sendRes = await emailService.sendTeamEmail({
        to: recipientEmail,
        recipientName,
        subject,
        body: content,
        emailType,
        team: {
          id: team.team_id,
          teamName: team.team_name,
          teamCode: team.team_code,
          category: team.category,
          rank: team.rank,
        },
        deadlineHours,
      });

      emailLogs[team.team_id] = {
        lastSentAt: nowIso,
        emailType,
        subject,
      };

      notificationsToInsert.push({
        teamId: team.team_id,
        type: emailType === "SLOT_CONFIRMATION" ? "SLOT_CONFIRMATION_INVITATION" : "ADMIN_ANNOUNCEMENT",
        title: subject,
        message:
          emailType === "SLOT_CONFIRMATION"
            ? `Action required: Please confirm or decline your Phase 2 slot invitation.`
            : content.substring(0, 150) + "...",
      });

      sentResults.push({
        teamId: team.team_id,
        teamName: team.team_name,
        teamCode: team.team_code,
        recipientEmail,
        success: sendRes.success,
        isRealDelivery: sendRes.isRealDelivery,
        error: !recipientEmail ? "No leader email found in database for this team" : sendRes.error,
      });
    }

    // 5. Persist updated email logs and batch insert notifications
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.systemConfig)
        .values({
          key: "phase1_email_logs",
          value: JSON.stringify(emailLogs),
          type: "STRING",
          updatedAt: new Date(),
          updatedBy: admin.profileId,
        })
        .onConflictDoUpdate({
          target: schema.systemConfig.key,
          set: {
            value: JSON.stringify(emailLogs),
            updatedAt: new Date(),
            updatedBy: admin.profileId,
          },
        });

      if (notificationsToInsert.length > 0) {
        await tx.insert(schema.notifications).values(notificationsToInsert);
      }

      await auditService.log(tx, {
        actorId: admin.profileId,
        action: "BATTLE_ROYALE_EMAILS_SENT",
        entityType: "battle_royale",
        entityId: "blast",
        metadata: {
          recipientType,
          totalSent: sentResults.length,
          emailType,
          subject,
        },
      });
    });

    const realDeliveredCount = sentResults.filter((r) => r.isRealDelivery).length;

    res.json({
      success: true,
      message: emailService.isConfigured()
        ? `Successfully sent ${realDeliveredCount} real email(s) to team leaders.`
        : `Emails recorded in development simulation mode for ${sentResults.length} team(s). (To send real emails to inboxes, configure SMTP or RESEND_API_KEY in your .env).`,
      data: {
        isEmailConfigured: emailService.isConfigured(),
        totalRecipients: sentResults.length,
        realDeliveredCount,
        emailType,
        recipients: sentResults,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
