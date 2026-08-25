import { pgEnum } from "drizzle-orm/pg-core";

// Team lifecycle state machine
export const teamStatusEnum = pgEnum("team_status", [
  "NEW",
  "TOP30",
  "AWAITING_CONFIRMATION",
  "PAYMENT_PENDING",
  "DOCUMENT_PENDING",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "DROPPED",
  "WAITLIST",
  "FINALIST",
  "SUBMISSION_OPEN",
  "SUBMITTED",
  "JUDGED",
]);

export const teamCategoryEnum = pgEnum("team_category", [
  "NATIONAL",
  "MIX",
  "INTERNATIONAL",
]);

export const roleTypeEnum = pgEnum("role_type", [
  "USER",
  "PARTICIPANT",
  "ADMIN",
  "JUDGE",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "TEAM_LEADER",
  "TEAM_MEMBER",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "ACTIVE",
  "PENDING",
  "REMOVED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const tokenStatusEnum = pgEnum("token_status", [
  "ISSUED",
  "ACTIVATED",
  "REVOKED",
  "EXPIRED",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "DRAFT",
  "SUBMITTED",
  "LOCKED",
]);

export const attendanceTypeEnum = pgEnum("attendance_type", [
  "DAY1",
  "DAY2",
  "CEREMONY",
]);

export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "INCOMPLETE",
  "COMPLETE",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export const slotStatusEnum = pgEnum("slot_status", [
  "AVAILABLE",
  "CLAIMED",
]);

export const judgeStatusEnum = pgEnum("judge_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const migrationBatchStatusEnum = pgEnum("migration_batch_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const configTypeEnum = pgEnum("config_type", [
  "STRING",
  "NUMBER",
  "BOOLEAN",
  "JSON",
]);
