import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { submissionService } from "../services/submission.service";
import { uploadPresentation, getStorageKey } from "../middleware/upload.middleware";
import { uploadFileToStorage } from "../lib/storage";
import { z } from "zod";

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
        if (process.env.STORAGE_PROVIDER === "supabase") {
          slideStorageKey = await uploadFileToStorage("presentations", req.file.path, req.file.filename, req.file.mimetype);
        } else {
          slideStorageKey = getStorageKey(req.file.path);
        }
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

export default router;
