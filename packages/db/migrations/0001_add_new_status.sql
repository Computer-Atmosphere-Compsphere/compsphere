ALTER TYPE "public"."team_status" ADD VALUE 'NEW' BEFORE 'TOP30';--> statement-breakpoint
ALTER TABLE "competition_teams" ALTER COLUMN "status" SET DEFAULT 'NEW';