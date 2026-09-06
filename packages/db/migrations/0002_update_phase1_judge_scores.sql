ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "technical_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "problem_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "innovation_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "market_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "judge_scores" ADD COLUMN IF NOT EXISTS "document_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "judge_scores" DROP COLUMN IF EXISTS "mvp_score";
ALTER TABLE "judge_scores" DROP COLUMN IF EXISTS "impact_score";
ALTER TABLE "judge_scores" DROP COLUMN IF EXISTS "creative_score";
ALTER TABLE "judge_scores" DROP COLUMN IF EXISTS "pitch_score";
