import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  uniqueIndex,
  index,
  jsonb,
  bigint,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  teamStatusEnum,
  teamCategoryEnum,
  roleTypeEnum,
  memberRoleEnum,
  memberStatusEnum,
  paymentStatusEnum,
  tokenStatusEnum,
  submissionStatusEnum,
  attendanceTypeEnum,
  onboardingStatusEnum,
  inviteStatusEnum,
  judgeStatusEnum,
  migrationBatchStatusEnum,
  configTypeEnum,
} from "./enums";

// ---------------------------------------------------------------------------
// PROFILES — One per authenticated Google user
// ---------------------------------------------------------------------------
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    googleSub: text("google_sub").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    preferredRole: roleTypeEnum("preferred_role"),
    onboardingStatus: onboardingStatusEnum("onboarding_status")
      .notNull()
      .default("INCOMPLETE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    googleSubIdx: uniqueIndex("profiles_google_sub_idx").on(t.googleSub),
    emailIdx: uniqueIndex("profiles_email_idx").on(t.email),
  })
);

// ---------------------------------------------------------------------------
// COMPETITION TEAMS — 100 imported from Devpost
// ---------------------------------------------------------------------------
export const competitionTeams = pgTable(
  "competition_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamCode: text("team_code").notNull(),
    teamName: text("team_name").notNull(),
    category: teamCategoryEnum("category").notNull(),
    countryMix: text("country_mix"),
    originalRank: integer("original_rank").notNull(),
    status: teamStatusEnum("status").notNull().default("NEW"),
    paymentRequired: boolean("payment_required").notNull().default(true),
    paymentAmount: integer("payment_amount").notNull().default(0),
    confirmationStartedAt: timestamp("confirmation_started_at", {
      withTimezone: true,
    }),
    confirmationDeadline: timestamp("confirmation_deadline", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    teamCodeIdx: uniqueIndex("competition_teams_code_idx").on(t.teamCode),
    statusCategoryIdx: index("competition_teams_status_category_idx").on(
      t.status,
      t.category
    ),
    originalRankIdx: index("competition_teams_rank_idx").on(t.originalRank),
  })
);

// ---------------------------------------------------------------------------
// TEAM ACCESS TOKENS — 30 tokens for Top 30 teams
// ---------------------------------------------------------------------------
export const teamAccessTokens = pgTable(
  "team_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(), // SHA-256 hex, never plaintext
    status: tokenStatusEnum("status").notNull().default("ISSUED"),
    activatedBy: uuid("activated_by").references(() => profiles.id),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenHashIdx: uniqueIndex("team_access_tokens_hash_idx").on(t.tokenHash),
    teamIdx: index("team_access_tokens_team_idx").on(t.teamId),
  })
);

// ---------------------------------------------------------------------------
// TEAM MEMBERS
// ---------------------------------------------------------------------------
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
    status: memberStatusEnum("status").notNull().default("ACTIVE"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (t) => ({
    teamUserIdx: uniqueIndex("team_members_team_user_idx").on(
      t.teamId,
      t.userId
    ),
    teamIdx: index("team_members_team_idx").on(t.teamId),
    userIdx: index("team_members_user_idx").on(t.userId),
  })
);

// ---------------------------------------------------------------------------
// MEMBER INVITES — Leader generates invite links for team members
// ---------------------------------------------------------------------------
export const memberInvites = pgTable(
  "member_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    inviteHash: text("invite_hash").notNull(), // SHA-256 of raw token
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    status: inviteStatusEnum("status").notNull().default("PENDING"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedBy: uuid("used_by").references(() => profiles.id),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    inviteHashIdx: uniqueIndex("member_invites_hash_idx").on(t.inviteHash),
    teamIdx: index("member_invites_team_idx").on(t.teamId),
  })
);

// ---------------------------------------------------------------------------
// ROLE ASSIGNMENTS
// ---------------------------------------------------------------------------
export const roleAssignments = pgTable(
  "role_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: roleTypeEnum("role").notNull(),
    source: text("source").notNull(), // 'google_oauth', 'committee_token', 'judge_token', 'team_token'
    teamId: uuid("team_id").references(() => competitionTeams.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedBy: uuid("assigned_by").references(() => profiles.id),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("role_assignments_user_idx").on(t.userId),
    activeRoleIdx: index("role_assignments_active_idx").on(
      t.userId,
      t.role
    ),
  })
);

// ---------------------------------------------------------------------------
// PROPOSALS — Imported from Devpost
// ---------------------------------------------------------------------------
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => competitionTeams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source").notNull().default("DEVPOST"),
  devpostUrl: text("devpost_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const proposalFiles = pgTable("proposal_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// PAYMENTS — Team-level, not per-member
// ---------------------------------------------------------------------------
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    proofStorageKey: text("proof_storage_key"),
    proofFilename: text("proof_filename"),
    submittedBy: uuid("submitted_by")
      .notNull()
      .references(() => profiles.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedBy: uuid("verified_by").references(() => profiles.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
  },
  (t) => ({
    teamIdx: index("payments_team_idx").on(t.teamId),
    statusIdx: index("payments_status_idx").on(t.status),
  })
);

// ---------------------------------------------------------------------------
// SUBMISSIONS — Phase 2 deliverables
// ---------------------------------------------------------------------------
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    repositoryUrl: text("repository_url").notNull(),
    deploymentUrl: text("deployment_url"),
    slideStorageKey: text("slide_storage_key"),
    slideFilename: text("slide_filename"),
    slideSizeBytes: bigint("slide_size_bytes", { mode: "number" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: submissionStatusEnum("status").notNull().default("SUBMITTED"),
  },
  (t) => ({
    teamIdx: uniqueIndex("submissions_team_idx").on(t.teamId),
  })
);

// ---------------------------------------------------------------------------
// JUDGES
// ---------------------------------------------------------------------------
export const judges = pgTable(
  "judges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: judgeStatusEnum("status").notNull().default("ACTIVE"),
  },
  (t) => ({
    userIdx: uniqueIndex("judges_user_idx").on(t.userId),
  })
);

export const judgeAssignments = pgTable(
  "judge_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judgeId: uuid("judge_id")
      .notNull()
      .references(() => judges.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    judgeTeamIdx: uniqueIndex("judge_assignments_judge_team_idx").on(
      t.judgeId,
      t.teamId
    ),
  })
);

export const judgeScores = pgTable(
  "judge_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judgeId: uuid("judge_id")
      .notNull()
      .references(() => judges.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    // Scores 1-100
    mvpScore: integer("mvp_score").notNull(),
    impactScore: integer("impact_score").notNull(),
    creativeScore: integer("creative_score").notNull(),
    pitchScore: integer("pitch_score").notNull(),
    finalScore: numeric("final_score", { precision: 6, scale: 2 }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    judgeTeamIdx: uniqueIndex("judge_scores_judge_team_idx").on(
      t.judgeId,
      t.teamId
    ),
    teamIdx: index("judge_scores_team_idx").on(t.teamId),
  })
);

// ---------------------------------------------------------------------------
// BATTLE ROYALE SLOTS — Atomic slot management
// ---------------------------------------------------------------------------
export const battleRoyaleConfig = pgTable("battle_royale_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  isActive: boolean("is_active").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }),
  startedBy: uuid("started_by").references(() => profiles.id),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const battleRoyaleSlots = pgTable(
  "battle_royale_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    configId: uuid("config_id")
      .notNull()
      .references(() => battleRoyaleConfig.id, { onDelete: "cascade" }),
    category: teamCategoryEnum("category").notNull(),
    claimedBy: uuid("claimed_by").references(() => competitionTeams.id),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
  },
  (t) => ({
    configCategoryIdx: index("battle_royale_slots_config_category_idx").on(
      t.configId,
      t.category
    ),
    availableIdx: index("battle_royale_slots_available_idx").on(
      t.configId,
      t.claimedBy
    ),
  })
);

// ---------------------------------------------------------------------------
// QR TOKENS — One per active participant
// ---------------------------------------------------------------------------
export const qrTokens = pgTable(
  "qr_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    active: boolean("active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenHashIdx: uniqueIndex("qr_tokens_hash_idx").on(t.tokenHash),
    userTeamIdx: index("qr_tokens_user_team_idx").on(t.userId, t.teamId),
  })
);

// ---------------------------------------------------------------------------
// ATTENDANCE
// ---------------------------------------------------------------------------
export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => competitionTeams.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    attendanceType: attendanceTypeEnum("attendance_type").notNull(),
    attendanceDate: timestamp("attendance_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    scannedBy: uuid("scanned_by")
      .notNull()
      .references(() => profiles.id),
    scannedAt: timestamp("scanned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // Prevent duplicate attendance for same user + type + date (date truncated to day)
    uniqueAttendanceIdx: uniqueIndex("attendance_unique_idx").on(
      t.userId,
      t.attendanceType,
      t.attendanceDate
    ),
  })
);

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    teamId: uuid("team_id").references(() => competitionTeams.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
    teamIdx: index("notifications_team_idx").on(t.teamId),
    unreadIdx: index("notifications_unread_idx").on(t.userId, t.readAt),
  })
);

// ---------------------------------------------------------------------------
// AUDIT LOGS — Every admin action is logged
// ---------------------------------------------------------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    actorIdx: index("audit_logs_actor_idx").on(t.actorId),
    entityIdx: index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  })
);

// ---------------------------------------------------------------------------
// SYSTEM CONFIG — All configurable business parameters
// ---------------------------------------------------------------------------
export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  type: configTypeEnum("type").notNull().default("STRING"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid("updated_by").references(() => profiles.id),
});

// ---------------------------------------------------------------------------
// MIGRATION BATCHES — Track CSV imports
// ---------------------------------------------------------------------------
export const migrationBatches = pgTable("migration_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  fileName: text("file_name").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  status: migrationBatchStatusEnum("status").notNull().default("PENDING"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// BETTER-AUTH SESSION TABLES (required by better-auth)
// ---------------------------------------------------------------------------
export const betterAuthUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const betterAuthSessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUsers.id, { onDelete: "cascade" }),
});

export const betterAuthAccounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const betterAuthVerifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
