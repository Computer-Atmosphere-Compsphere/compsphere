CREATE TYPE "public"."attendance_type" AS ENUM('DAY1', 'DAY2', 'CEREMONY');--> statement-breakpoint
CREATE TYPE "public"."config_type" AS ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."judge_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('TEAM_LEADER', 'TEAM_MEMBER');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('ACTIVE', 'PENDING', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."migration_batch_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('INCOMPLETE', 'COMPLETE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('USER', 'PARTICIPANT', 'ADMIN', 'JUDGE');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('AVAILABLE', 'CLAIMED');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('DRAFT', 'SUBMITTED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."team_category" AS ENUM('NATIONAL', 'MIX', 'INTERNATIONAL');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('TOP30', 'AWAITING_CONFIRMATION', 'PAYMENT_PENDING', 'DOCUMENT_PENDING', 'VERIFICATION_PENDING', 'VERIFIED', 'DROPPED', 'WAITLIST', 'FINALIST', 'SUBMISSION_OPEN', 'SUBMITTED', 'JUDGED');--> statement-breakpoint
CREATE TYPE "public"."token_status" AS ENUM('ISSUED', 'ACTIVATED', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attendance_type" "attendance_type" NOT NULL,
	"attendance_date" timestamp with time zone DEFAULT now() NOT NULL,
	"scanned_by" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_royale_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone,
	"started_by" uuid,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_royale_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid NOT NULL,
	"category" "team_category" NOT NULL,
	"claimed_by" uuid,
	"claimed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "competition_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_code" text NOT NULL,
	"team_name" text NOT NULL,
	"category" "team_category" NOT NULL,
	"country_mix" text,
	"original_rank" integer NOT NULL,
	"status" "team_status" DEFAULT 'TOP30' NOT NULL,
	"payment_required" boolean DEFAULT true NOT NULL,
	"payment_amount" integer DEFAULT 0 NOT NULL,
	"confirmation_started_at" timestamp with time zone,
	"confirmation_deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judge_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judge_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"mvp_score" integer NOT NULL,
	"impact_score" integer NOT NULL,
	"creative_score" integer NOT NULL,
	"pitch_score" integer NOT NULL,
	"final_score" numeric(6, 2) NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "judge_status" DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"invite_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "invite_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_by" uuid,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"file_name" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"status" "migration_batch_status" DEFAULT 'PENDING' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"team_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"proof_storage_key" text,
	"proof_filename" text,
	"submitted_by" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"preferred_role" "role_type",
	"onboarding_status" "onboarding_status" DEFAULT 'INCOMPLETE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" text DEFAULT 'DEVPOST' NOT NULL,
	"devpost_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role_type" NOT NULL,
	"source" text NOT NULL,
	"team_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"repository_url" text NOT NULL,
	"deployment_url" text,
	"slide_storage_key" text,
	"slide_filename" text,
	"slide_size_bytes" bigint,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "submission_status" DEFAULT 'SUBMITTED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"type" "config_type" DEFAULT 'STRING' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "team_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"status" "token_status" DEFAULT 'ISSUED' NOT NULL,
	"activated_by" uuid,
	"activated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" NOT NULL,
	"status" "member_status" DEFAULT 'ACTIVE' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_scanned_by_profiles_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_royale_config" ADD CONSTRAINT "battle_royale_config_started_by_profiles_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_royale_slots" ADD CONSTRAINT "battle_royale_slots_config_id_battle_royale_config_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."battle_royale_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_royale_slots" ADD CONSTRAINT "battle_royale_slots_claimed_by_competition_teams_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."competition_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_assignments" ADD CONSTRAINT "judge_assignments_judge_id_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_assignments" ADD CONSTRAINT "judge_assignments_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_judge_id_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judges" ADD CONSTRAINT "judges_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_used_by_profiles_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_batches" ADD CONSTRAINT "migration_batches_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_files" ADD CONSTRAINT "proposal_files_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_assigned_by_profiles_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_access_tokens" ADD CONSTRAINT "team_access_tokens_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_access_tokens" ADD CONSTRAINT "team_access_tokens_activated_by_profiles_id_fk" FOREIGN KEY ("activated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_competition_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."competition_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_unique_idx" ON "attendance" USING btree ("user_id","attendance_type","attendance_date");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "battle_royale_slots_config_category_idx" ON "battle_royale_slots" USING btree ("config_id","category");--> statement-breakpoint
CREATE INDEX "battle_royale_slots_available_idx" ON "battle_royale_slots" USING btree ("config_id","claimed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_teams_code_idx" ON "competition_teams" USING btree ("team_code");--> statement-breakpoint
CREATE INDEX "competition_teams_status_category_idx" ON "competition_teams" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "competition_teams_rank_idx" ON "competition_teams" USING btree ("original_rank");--> statement-breakpoint
CREATE UNIQUE INDEX "judge_assignments_judge_team_idx" ON "judge_assignments" USING btree ("judge_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "judge_scores_judge_team_idx" ON "judge_scores" USING btree ("judge_id","team_id");--> statement-breakpoint
CREATE INDEX "judge_scores_team_idx" ON "judge_scores" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "judges_user_idx" ON "judges" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_invites_hash_idx" ON "member_invites" USING btree ("invite_hash");--> statement-breakpoint
CREATE INDEX "member_invites_team_idx" ON "member_invites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_team_idx" ON "notifications" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "payments_team_idx" ON "payments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_google_sub_idx" ON "profiles" USING btree ("google_sub");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_tokens_hash_idx" ON "qr_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "qr_tokens_user_team_idx" ON "qr_tokens" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "role_assignments_user_idx" ON "role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_assignments_active_idx" ON "role_assignments" USING btree ("user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_team_idx" ON "submissions" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_access_tokens_hash_idx" ON "team_access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "team_access_tokens_team_idx" ON "team_access_tokens" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id");