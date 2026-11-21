import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { submissionService } from "../services/submission.service";
import { uploadPresentation } from "../middleware/upload.middleware";
import { uploadFileToStorage, generatePresignedUrl, isHostinger } from "../lib/storage";
import { db, schema } from "@compsphere/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import path from "path";

const router = Router();

/**
 * Submit Phase 2 deliverables (repository, slides, deployment URL)
 * POST /api/submissions/submit
 */
router.post("/submit", requireAuth, async (req, res, next) => {
  uploadPresentation(req, res, async (err) => {
    if (err) return next(err);

    try {
      const user = req.sessionUser!;
      const bodySchema = z.object({
        repositoryUrl: z.string().url("Repository URL must be a valid link"),
        deploymentUrl: z.string().url("Deployment URL must be a valid link").optional().nullable(),
      });

      const parsed = bodySchema.parse(req.body);

      let slideStorageKey: string | null = null;
      let slideFilename: string | null = null;
      let slideSizeBytes: number | null = null;

      if (req.file) {
        slideFilename = req.file.originalname;
        slideSizeBytes = req.file.size;
        slideStorageKey = await uploadFileToStorage("presentations", req.file.path, req.file.filename, req.file.mimetype);
      }

      const submission = await submissionService.submit(
        user.teamId!,
        user.profileId,
        parsed.repositoryUrl,
        parsed.deploymentUrl || null,
        slideStorageKey,
        slideFilename,
        slideSizeBytes
      );

      res.json({
        success: true,
        message: "Phase 2 deliverables submitted successfully.",
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  });
});

/**
 * Get deadline (public / authed)
 * GET /api/submissions/deadline
 */
router.get("/deadline", async (req, res, next) => {
  try {
    const deadline = await submissionService.getDeadline();
    res.json({
      success: true,
      data: {
        deadline: deadline.toISOString(),
        isExpired: new Date() >= deadline,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get a presigned/direct URL to view a team's presentation slide.
 * Accessible by JUDGE, ADMIN, or the team member themselves.
 * GET /api/submissions/slide-url/:teamId
 */
router.get("/slide-url/:teamId", requireAuth, async (req, res, next) => {
  try {
    const user = req.sessionUser!;
    const { teamId } = req.params as { teamId: string };

    // Authorization: must be ADMIN, JUDGE, or a member of that team
    const isPrivileged =
      user.role === "ADMIN" || user.role === "JUDGE";
    const isOwnTeam = user.teamId === teamId;

    if (!isPrivileged && !isOwnTeam) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    // Fetch the submission
    const submission = await db.query.submissions.findFirst({
      where: eq(schema.submissions.teamId, teamId),
    });

    if (!submission || !submission.slideStorageKey) {
      return res.status(404).json({
        success: false,
        error: "No presentation slide found for this team.",
      });
    }

    // Generate presigned URL (Hostinger) or local upload URL
    let slideUrl: string;
    if (isHostinger) {
      slideUrl = generatePresignedUrl(
        submission.slideStorageKey,
        3600, // 1 hour TTL
        submission.slideFilename ?? undefined
      );
    } else {
      // Local dev: serve from /api/uploads/<key>
      slideUrl = `/api/uploads/${submission.slideStorageKey.replace(/^\/?/, "")}`;
    }

    res.json({
      success: true,
      data: {
        slideUrl,
        slideFilename: submission.slideFilename,
        slideSizeBytes: submission.slideSizeBytes,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
