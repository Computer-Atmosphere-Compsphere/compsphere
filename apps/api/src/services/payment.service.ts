import { db, schema } from "@compsphere/db";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../middleware/error.middleware";
import { auditService } from "./audit.service";
import { sseService } from "../sse/sse.service";

export const paymentService = {
  /**
   * Submit payment proof or document verification for a team.
   * Moves team status from AWAITING_CONFIRMATION (or REJECTED states) to VERIFICATION_PENDING.
   */
  async submitVerification(
    teamId: string,
    userId: string,
    amount: number,
    proofStorageKey: string | null,
    proofFilename: string | null
  ) {
    return await db.transaction(async (tx) => {
      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, teamId),
      });

      if (!team) throw new AppError(404, "Team not found");

      // Verify category-specific requirements
      if (team.category === "INTERNATIONAL") {
        if (amount !== 0) {
          throw new AppError(400, "International teams do not pay fees.");
        }
        if (!proofStorageKey) {
          throw new AppError(400, "Commitment letter or ID verification is required.");
        }
      } else {
        // National or Mix
        if (amount !== 120000) {
          throw new AppError(400, "Payment amount must be exactly Rp120,000.");
        }
        if (!proofStorageKey) {
          throw new AppError(400, "Payment proof is required.");
        }
      }

      // 48-hour deadline validation
      if (team.confirmationDeadline && new Date() > new Date(team.confirmationDeadline)) {
        // Mark as DROPPED automatically if expired
        await tx.update(schema.competitionTeams)
          .set({ status: "DROPPED" })
          .where(eq(schema.competitionTeams.id, teamId));
        throw new AppError(400, "Confirmation window has expired.", "CONFIRMATION_EXPIRED");
      }

      // Insert/update payment record
      const [payment] = await tx
        .insert(schema.payments)
        .values({
          teamId,
          amount,
          status: "PENDING",
          proofStorageKey,
          proofFilename,
          submittedBy: userId,
        })
        .returning();

      // If team is already VERIFIED, auto-approve this payment
      if (team.status === "VERIFIED") {
        await tx
          .update(schema.payments)
          .set({
            status: "APPROVED",
            verifiedBy: userId,
            verifiedAt: new Date(),
          })
          .where(eq(schema.payments.id, payment.id));

        await auditService.log(tx, {
          actorId: userId,
          action: "PAYMENT_APPROVED",
          entityType: "payment",
          entityId: payment.id,
          metadata: { category: team.category, amount, autoApproved: true },
        });

        sseService.sendToTeam(teamId, "payment:verified", {
          paymentId: payment.id,
          teamId,
        });

        return { ...payment, status: "APPROVED" as const };
      }

      // Otherwise, set to VERIFICATION_PENDING for admin review
      await tx
        .update(schema.competitionTeams)
        .set({
          status: "VERIFICATION_PENDING",
          updatedAt: new Date(),
        })
        .where(eq(schema.competitionTeams.id, teamId));

      await auditService.log(tx, {
        actorId: userId,
        action: "CONFIRMATION_SUBMITTED",
        entityType: "payment",
        entityId: payment.id,
        metadata: { category: team.category, amount },
      });

      sseService.sendToTeam(teamId, "team:status_changed", {
        teamId,
        newStatus: "VERIFICATION_PENDING",
      });

      sseService.broadcast("admin:counter_updated", { event: "verification_submitted" });

      return payment;
    });
  },

  /**
   * Verify (approve) a payment/document and confirm the team.
   */
  async verifyPayment(adminId: string, paymentId: string) {
    return await db.transaction(async (tx) => {
      const payment = await tx.query.payments.findFirst({
        where: eq(schema.payments.id, paymentId),
      });

      if (!payment) throw new AppError(404, "Payment record not found");
      if (payment.status !== "PENDING") {
        throw new AppError(400, "Payment has already been processed");
      }

      // Update payment status
      await tx
        .update(schema.payments)
        .set({
          status: "APPROVED",
          verifiedBy: adminId,
          verifiedAt: new Date(),
        })
        .where(eq(schema.payments.id, paymentId));

      // Update team status to VERIFIED
      await tx
        .update(schema.competitionTeams)
        .set({
          status: "VERIFIED",
          updatedAt: new Date(),
        })
        .where(eq(schema.competitionTeams.id, payment.teamId));

      await auditService.log(tx, {
        actorId: adminId,
        action: "PAYMENT_APPROVED",
        entityType: "payment",
        entityId: paymentId,
        metadata: { teamId: payment.teamId },
      });

      await tx.insert(schema.notifications).values({
        teamId: payment.teamId,
        type: "PAYMENT_APPROVED",
        title: "Payment Approved! 💳",
        message: "Your payment verification was approved. Your team status is now VERIFIED.",
      });

      sseService.sendToTeam(payment.teamId, "team:status_changed", {
        teamId: payment.teamId,
        newStatus: "VERIFIED",
      });

      sseService.sendToTeam(payment.teamId, "payment:verified", {
        paymentId,
        teamId: payment.teamId,
      });

      sseService.broadcast("admin:counter_updated", { event: "payment_approved" });

      return { paymentId, status: "APPROVED" };
    });
  },

  /**
   * Reject a payment/document. Returns team status to either AWAITING_CONFIRMATION or DOCUMENT_PENDING.
   */
  async rejectPayment(adminId: string, paymentId: string, reason: string) {
    if (!reason) throw new AppError(400, "Rejection reason is required");

    return await db.transaction(async (tx) => {
      const payment = await tx.query.payments.findFirst({
        where: eq(schema.payments.id, paymentId),
      });

      if (!payment) throw new AppError(404, "Payment record not found");
      if (payment.status !== "PENDING") {
        throw new AppError(400, "Payment has already been processed");
      }

      // Update payment status
      await tx
        .update(schema.payments)
        .set({
          status: "REJECTED",
          verifiedBy: adminId,
          verifiedAt: new Date(),
          rejectionReason: reason,
        })
        .where(eq(schema.payments.id, paymentId));

      const team = await tx.query.competitionTeams.findFirst({
        where: eq(schema.competitionTeams.id, payment.teamId),
      });

      const nextStatus = team?.category === "INTERNATIONAL" ? "DOCUMENT_PENDING" : "PAYMENT_PENDING";

      // Reset team status to allow re-upload
      await tx
        .update(schema.competitionTeams)
        .set({
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.competitionTeams.id, payment.teamId));

      await auditService.log(tx, {
        actorId: adminId,
        action: "PAYMENT_REJECTED",
        entityType: "payment",
        entityId: paymentId,
        metadata: { teamId: payment.teamId, reason },
      });

      await tx.insert(schema.notifications).values({
        teamId: payment.teamId,
        type: "PAYMENT_REJECTED",
        title: "Verification Rejected ⚠️",
        message: `Your proof was rejected. Reason: ${reason}. Please re-submit correct files before your confirmation window ends.`,
      });

      sseService.sendToTeam(payment.teamId, "team:status_changed", {
        teamId: payment.teamId,
        newStatus: nextStatus,
      });

      return { paymentId, status: "REJECTED" };
    });
  },

  /**
   * Get all payments (verification queue) with team info
   */
  async getPaymentQueue() {
    const payments = await db.query.payments.findMany({
      orderBy: [desc(schema.payments.submittedAt)],
      with: {
        team: {
          columns: {
            id: true,
            teamName: true,
            teamCode: true,
            category: true,
            status: true,
            originalRank: true,
            confirmationDeadline: true,
          },
        },
        submittedBy: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return payments;
  },
};
