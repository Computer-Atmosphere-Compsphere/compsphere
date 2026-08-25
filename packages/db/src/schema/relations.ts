import { relations } from "drizzle-orm";
import {
  profiles,
  competitionTeams,
  teamAccessTokens,
  teamMembers,
  memberInvites,
  roleAssignments,
  proposals,
  proposalFiles,
  payments,
  submissions,
  judges,
  judgeAssignments,
  judgeScores,
  battleRoyaleConfig,
  battleRoyaleSlots,
  qrTokens,
  attendance,
  notifications,
  auditLogs,
  systemConfig,
  migrationBatches,
} from "./tables";

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------
export const profilesRelations = relations(profiles, ({ many }) => ({
  teamMembers: many(teamMembers),
  roleAssignments: many(roleAssignments),
  judges: many(judges),
  paymentsSubmitted: many(payments, { relationName: "payments_submittedBy" }),
  paymentsVerified: many(payments, { relationName: "payments_verifiedBy" }),
  qrTokens: many(qrTokens),
  attendanceScanned: many(attendance, { relationName: "attendance_scannedBy" }),
  attendanceProfile: many(attendance, { relationName: "attendance_userId" }),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  systemConfigUpdated: many(systemConfig),
  migrationBatches: many(migrationBatches),
  tokensActivated: many(teamAccessTokens, { relationName: "tokens_activatedBy" }),
}));

// ---------------------------------------------------------------------------
// COMPETITION TEAMS
// ---------------------------------------------------------------------------
export const competitionTeamsRelations = relations(competitionTeams, ({ many }) => ({
  accessTokens: many(teamAccessTokens),
  members: many(teamMembers),
  invites: many(memberInvites),
  roleAssignments: many(roleAssignments),
  proposal: many(proposals),
  payments: many(payments),
  submission: many(submissions),
  judgeAssignments: many(judgeAssignments),
  judgeScores: many(judgeScores),
  battleRoyaleSlotsClaimed: many(battleRoyaleSlots, { relationName: "br_slots_claimedBy" }),
  qrTokens: many(qrTokens),
  attendance: many(attendance),
  notifications: many(notifications),
}));

// ---------------------------------------------------------------------------
// TEAM ACCESS TOKENS
// ---------------------------------------------------------------------------
export const teamAccessTokensRelations = relations(teamAccessTokens, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [teamAccessTokens.teamId],
    references: [competitionTeams.id],
  }),
  activatedBy: one(profiles, {
    fields: [teamAccessTokens.activatedBy],
    references: [profiles.id],
    relationName: "tokens_activatedBy",
  }),
}));

// ---------------------------------------------------------------------------
// TEAM MEMBERS
// ---------------------------------------------------------------------------
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [teamMembers.teamId],
    references: [competitionTeams.id],
  }),
  user: one(profiles, {
    fields: [teamMembers.userId],
    references: [profiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// MEMBER INVITES
// ---------------------------------------------------------------------------
export const memberInvitesRelations = relations(memberInvites, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [memberInvites.teamId],
    references: [competitionTeams.id],
  }),
  createdBy: one(profiles, {
    fields: [memberInvites.createdBy],
    references: [profiles.id],
    relationName: "invites_createdBy",
  }),
  usedBy: one(profiles, {
    fields: [memberInvites.usedBy],
    references: [profiles.id],
    relationName: "invites_usedBy",
  }),
}));

// ---------------------------------------------------------------------------
// ROLE ASSIGNMENTS
// ---------------------------------------------------------------------------
export const roleAssignmentsRelations = relations(roleAssignments, ({ one }) => ({
  user: one(profiles, {
    fields: [roleAssignments.userId],
    references: [profiles.id],
    relationName: "roles_userId",
  }),
  team: one(competitionTeams, {
    fields: [roleAssignments.teamId],
    references: [competitionTeams.id],
  }),
  assignedBy: one(profiles, {
    fields: [roleAssignments.assignedBy],
    references: [profiles.id],
    relationName: "roles_assignedBy",
  }),
}));

// ---------------------------------------------------------------------------
// PROPOSALS
// ---------------------------------------------------------------------------
export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  team: one(competitionTeams, {
    fields: [proposals.teamId],
    references: [competitionTeams.id],
  }),
  files: many(proposalFiles),
}));

// ---------------------------------------------------------------------------
// PROPOSAL FILES
// ---------------------------------------------------------------------------
export const proposalFilesRelations = relations(proposalFiles, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalFiles.proposalId],
    references: [proposals.id],
  }),
}));

// ---------------------------------------------------------------------------
// PAYMENTS
// ---------------------------------------------------------------------------
export const paymentsRelations = relations(payments, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [payments.teamId],
    references: [competitionTeams.id],
  }),
  submittedBy: one(profiles, {
    fields: [payments.submittedBy],
    references: [profiles.id],
    relationName: "payments_submittedBy",
  }),
  verifiedBy: one(profiles, {
    fields: [payments.verifiedBy],
    references: [profiles.id],
    relationName: "payments_verifiedBy",
  }),
}));

// ---------------------------------------------------------------------------
// SUBMISSIONS
// ---------------------------------------------------------------------------
export const submissionsRelations = relations(submissions, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [submissions.teamId],
    references: [competitionTeams.id],
  }),
}));

// ---------------------------------------------------------------------------
// JUDGES
// ---------------------------------------------------------------------------
export const judgesRelations = relations(judges, ({ one, many }) => ({
  user: one(profiles, {
    fields: [judges.userId],
    references: [profiles.id],
  }),
  assignments: many(judgeAssignments),
  scores: many(judgeScores),
}));

// ---------------------------------------------------------------------------
// JUDGE ASSIGNMENTS
// ---------------------------------------------------------------------------
export const judgeAssignmentsRelations = relations(judgeAssignments, ({ one }) => ({
  judge: one(judges, {
    fields: [judgeAssignments.judgeId],
    references: [judges.id],
  }),
  team: one(competitionTeams, {
    fields: [judgeAssignments.teamId],
    references: [competitionTeams.id],
  }),
}));

// ---------------------------------------------------------------------------
// JUDGE SCORES
// ---------------------------------------------------------------------------
export const judgeScoresRelations = relations(judgeScores, ({ one }) => ({
  judge: one(judges, {
    fields: [judgeScores.judgeId],
    references: [judges.id],
  }),
  team: one(competitionTeams, {
    fields: [judgeScores.teamId],
    references: [competitionTeams.id],
  }),
}));

// ---------------------------------------------------------------------------
// BATTLE ROYALE CONFIG
// ---------------------------------------------------------------------------
export const battleRoyaleConfigRelations = relations(battleRoyaleConfig, ({ one, many }) => ({
  startedBy: one(profiles, {
    fields: [battleRoyaleConfig.startedBy],
    references: [profiles.id],
  }),
  slots: many(battleRoyaleSlots),
}));

// ---------------------------------------------------------------------------
// BATTLE ROYALE SLOTS
// ---------------------------------------------------------------------------
export const battleRoyaleSlotsRelations = relations(battleRoyaleSlots, ({ one }) => ({
  config: one(battleRoyaleConfig, {
    fields: [battleRoyaleSlots.configId],
    references: [battleRoyaleConfig.id],
  }),
  claimedBy: one(competitionTeams, {
    fields: [battleRoyaleSlots.claimedBy],
    references: [competitionTeams.id],
    relationName: "br_slots_claimedBy",
  }),
}));

// ---------------------------------------------------------------------------
// QR TOKENS
// ---------------------------------------------------------------------------
export const qrTokensRelations = relations(qrTokens, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [qrTokens.teamId],
    references: [competitionTeams.id],
  }),
  user: one(profiles, {
    fields: [qrTokens.userId],
    references: [profiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// ATTENDANCE
// ---------------------------------------------------------------------------
export const attendanceRelations = relations(attendance, ({ one }) => ({
  team: one(competitionTeams, {
    fields: [attendance.teamId],
    references: [competitionTeams.id],
  }),
  profile: one(profiles, {
    fields: [attendance.userId],
    references: [profiles.id],
    relationName: "attendance_userId",
  }),
  scannedBy: one(profiles, {
    fields: [attendance.scannedBy],
    references: [profiles.id],
    relationName: "attendance_scannedBy",
  }),
}));

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
  team: one(competitionTeams, {
    fields: [notifications.teamId],
    references: [competitionTeams.id],
  }),
}));

// ---------------------------------------------------------------------------
// AUDIT LOGS
// ---------------------------------------------------------------------------
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(profiles, {
    fields: [auditLogs.actorId],
    references: [profiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// SYSTEM CONFIG
// ---------------------------------------------------------------------------
export const systemConfigRelations = relations(systemConfig, ({ one }) => ({
  updatedBy: one(profiles, {
    fields: [systemConfig.updatedBy],
    references: [profiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// MIGRATION BATCHES
// ---------------------------------------------------------------------------
export const migrationBatchesRelations = relations(migrationBatches, ({ one }) => ({
  createdBy: one(profiles, {
    fields: [migrationBatches.createdBy],
    references: [profiles.id],
  }),
}));
