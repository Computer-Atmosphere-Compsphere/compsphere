import { db, schema } from "@compsphere/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import { sseService } from "../sse/sse.service";
import type { ExtractTablesWithRelations } from "drizzle-orm";

export const battleRoyaleService = {
  /**
   * Admin: initiate Battle Royale — opens the claiming window
   */
  async initiate(adminId: string) {
    return await db.transaction(async (tx) => {
      // Check if already active
      const existing = await tx.query.battleRoyaleConfig.findFirst({
        where: eq(schema.battleRoyaleConfig.isActive, true),
      });

      if (existing) {
        throw new AppError(409, "Battle Royale is already active", "BR_ALREADY_ACTIVE");
      }

      const [config] = await tx.update(schema.battleRoyaleConfig)
        .set({
          isActive: true,
          startedAt: new Date(),
          startedBy: adminId,
        })
        .returning();

      if (!config) throw new AppError(500, "Failed to initiate Battle Royale");

      await auditService.log(tx, {
        actorId: adminId,
        action: "BATTLE_ROYALE_INITIATED",
        entityType: "battle_royale",
        entityId: config.id,
        metadata: { startedAt: new Date() },
      });

      // Get current slot counts for broadcast
      const slotCounts = await this.getSlotCounts(config.id);

      sseService.broadcast("battle_royale:initiated", {
        configId: config.id,
        slots: slotCounts,
        startedAt: config.startedAt,
      });

      return config;
    });
  },

  /**
   * Claim a slot — ATOMIC with SELECT FOR UPDATE to prevent over-booking.
   * This is the critical transaction that prevents concurrent over-claiming.
   */
  async claimSlot(teamId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // 1. Verify Battle Royale is active
      const brConfig = await tx.query.battleRoyaleConfig.findFirst({
        where: eq(schema.battleRoyaleConfig.isActive, true),
      });

      if (!brConfig) {
        throw new AppError(400, "Battle Royale is not active", "BR_NOT_ACTIVE");
      }

      // 2. Validate team eligibility (inside transaction)
      const team = await tx.query.competitionTeams.findFirst({
        where: and(
          eq(schema.competitionTeams.id, teamId),
          eq(schema.competitionTeams.status, "WAITLIST")
        ),
      });

      if (!team) {
        throw new AppError(400, "Team is not eligible for Battle Royale", "TEAM_NOT_ELIGIBLE");
      }

      // 3. Check team hasn't already claimed a slot
      const existingClaim = await tx.query.battleRoyaleSlots.findFirst({
        where: eq(schema.battleRoyaleSlots.claimedBy, teamId),
      });

      if (existingClaim) {
        throw new AppError(409, "Team has already claimed a slot", "ALREADY_CLAIMED");
      }

      // 4. Lock an available slot matching team's category (SELECT FOR UPDATE)
      // This prevents two teams from claiming the same slot simultaneously
      const [slot] = await tx.execute(sql`
        SELECT id, category FROM battle_royale_slots
        WHERE config_id = ${brConfig.id}
          AND claimed_by IS NULL
          AND category = ${team.category}
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `) as unknown as Array<{ id: string; category: string }>;

      if (!slot) {
        throw new AppError(409, `No available slots for category: ${team.category}`, "NO_SLOTS_AVAILABLE");
      }

      // 5. Claim the slot
      await tx.execute(sql`
        UPDATE battle_royale_slots
        SET claimed_by = ${teamId}, claimed_at = NOW()
        WHERE id = ${slot.id}
      `);

      // 6. Update team status
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await tx.update(schema.competitionTeams).set({
        status: "AWAITING_CONFIRMATION",
        confirmationStartedAt: new Date(),
        confirmationDeadline: deadline,
        updatedAt: new Date(),
      }).where(eq(schema.competitionTeams.id, teamId));

      // 7. Audit log
      await auditService.log(tx, {
        actorId: userId,
        action: "BATTLE_ROYALE_SLOT_CLAIMED",
        entityType: "team",
        entityId: teamId,
        metadata: { slotId: slot.id, category: team.category, brConfigId: brConfig.id },
      });

      // 8. Notify team
      await tx.insert(schema.notifications).values({
        teamId,
        type: "BATTLE_ROYALE_SUCCESS",
        title: "🎉 Slot Claimed!",
        message: `You've successfully claimed a slot! You now have 48 hours to confirm your team.`,
      });

      // 9. Broadcast updated slot counts
      const updatedCounts = await this.getSlotCounts(brConfig.id);
      sseService.broadcast("battle_royale:slot_updated", {
        slots: updatedCounts,
        recentClaim: { teamId, category: team.category },
      });

      return {
        success: true,
        slotId: slot.id,
        category: team.category,
        confirmationDeadline: deadline,
        slots: updatedCounts,
      };
    });
  },

  async getSlotCounts(configId: string) {
    const slots = await db.execute(sql`
      SELECT
        category,
        COUNT(*) AS total_slots,
        COUNT(claimed_by) AS claimed_slots,
        COUNT(*) FILTER (WHERE claimed_by IS NULL) AS available_slots
      FROM battle_royale_slots
      WHERE config_id = ${configId}
      GROUP BY category
    `) as unknown as Array<{
      category: string;
      total_slots: number;
      claimed_slots: number;
      available_slots: number;
    }>;

    return slots.map((s) => ({
      category: s.category,
      totalSlots: Number(s.total_slots),
      claimedSlots: Number(s.claimed_slots),
      availableSlots: Number(s.available_slots),
    }));
  },

  async getStatus() {
    const config = await db.query.battleRoyaleConfig.findFirst({
      where: eq(schema.battleRoyaleConfig.isActive, true),
    });

    if (!config) {
      return { isActive: false, slots: [], startedAt: null, startedBy: null };
    }

    const slots = await this.getSlotCounts(config.id);
    return {
      isActive: true,
      configId: config.id,
      slots,
      startedAt: config.startedAt,
      startedBy: config.startedBy,
    };
  },
};
