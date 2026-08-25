import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole, requireTeamLeader } from "../middleware/role.middleware.js";
import { paymentService } from "../services/payment.service.js";
import { uploadPaymentProof, uploadDocument, getStorageKey } from "../middleware/upload.middleware.js";
import { uploadFileToStorage } from "../lib/storage.js";
import { AppError } from "../middleware/error.middleware.js";
import { z } from "zod";
const router = Router();
/**
 * Submit payment proof or document verification for a team (Leader only)
 * POST /api/payments/submit
 */
router.post("/submit", requireAuth, requireTeamLeader, async (req, res, next) => {
    // Determine category to select correct file upload parser
    // Wait, since multer handles the parsing, we can check category first or just parse using custom logic
    // Let's use a general multer setup or handle both. Let's look at uploadPaymentProof vs uploadDocument
    // Actually, we can use a single multer file parsing for either "proof" or "document" or standard file
    // Let's define the handler dynamically or parse "proof" and check if it's there
    uploadPaymentProof(req, res, async (err) => {
        if (err)
            return next(err);
        try {
            const leader = req.sessionUser;
            const bodySchema = z.object({
                amount: z.preprocess((val) => Number(val), z.number()),
            });
            const { amount } = bodySchema.parse(req.body);
            let storageKey = null;
            let filename = null;
            if (req.file) {
                filename = req.file.originalname;
                if (process.env.STORAGE_PROVIDER === "supabase") {
                    storageKey = await uploadFileToStorage("payments", req.file.path, req.file.filename, req.file.mimetype);
                }
                else {
                    storageKey = getStorageKey(req.file.path);
                }
            }
            const payment = await paymentService.submitVerification(leader.teamId, leader.profileId, amount, storageKey, filename);
            res.json({
                success: true,
                message: "Verification document submitted successfully.",
                data: payment,
            });
        }
        catch (error) {
            next(error);
        }
    });
});
/**
 * Submit document verification for international teams (no payment, Leader only)
 * POST /api/payments/submit-document
 */
router.post("/submit-document", requireAuth, requireTeamLeader, async (req, res, next) => {
    uploadDocument(req, res, async (err) => {
        if (err)
            return next(err);
        try {
            const leader = req.sessionUser;
            let storageKey = null;
            let filename = null;
            if (req.file) {
                filename = req.file.originalname;
                if (process.env.STORAGE_PROVIDER === "supabase") {
                    storageKey = await uploadFileToStorage("documents", req.file.path, req.file.filename, req.file.mimetype);
                }
                else {
                    storageKey = getStorageKey(req.file.path);
                }
            }
            const payment = await paymentService.submitVerification(leader.teamId, leader.profileId, 0, // 0 amount for international document verification
            storageKey, filename);
            res.json({
                success: true,
                message: "Identity / commitment letter submitted successfully.",
                data: payment,
            });
        }
        catch (error) {
            next(error);
        }
    });
});
/**
 * Get all pending payment/document submissions (Admin only)
 * GET /api/payments/queue
 */
router.get("/queue", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
    try {
        const queue = await paymentService.getPaymentQueue();
        res.json({ success: true, data: queue });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Verify (approve/reject) a payment proof (Admin only)
 * POST /api/payments/verify
 */
router.post("/verify", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
    try {
        const admin = req.sessionUser;
        const bodySchema = z.object({
            paymentId: z.string().uuid(),
            action: z.enum(["APPROVE", "REJECT"]),
            rejectionReason: z.string().optional(),
        });
        const { paymentId, action, rejectionReason } = bodySchema.parse(req.body);
        let result;
        if (action === "APPROVE") {
            result = await paymentService.verifyPayment(admin.profileId, paymentId);
        }
        else {
            if (!rejectionReason) {
                throw new AppError(400, "Rejection reason is required.");
            }
            result = await paymentService.rejectPayment(admin.profileId, paymentId, rejectionReason);
        }
        res.json({
            success: true,
            message: `Payment successfully ${action.toLowerCase()}d.`,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=payments.routes.js.map