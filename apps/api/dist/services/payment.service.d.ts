export declare const paymentService: {
    /**
     * Submit payment proof or document verification for a team.
     * Moves team status from AWAITING_CONFIRMATION (or REJECTED states) to VERIFICATION_PENDING.
     */
    submitVerification(teamId: string, userId: string, amount: number, proofStorageKey: string | null, proofFilename: string | null): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        teamId: string;
        verifiedAt: Date | null;
        amount: number;
        proofStorageKey: string | null;
        proofFilename: string | null;
        submittedBy: string;
        submittedAt: Date;
        verifiedBy: string | null;
        rejectionReason: string | null;
    }>;
    /**
     * Verify (approve) a payment/document and confirm the team.
     */
    verifyPayment(adminId: string, paymentId: string): Promise<{
        paymentId: string;
        status: string;
    }>;
    /**
     * Reject a payment/document. Returns team status to either AWAITING_CONFIRMATION or DOCUMENT_PENDING.
     */
    rejectPayment(adminId: string, paymentId: string, reason: string): Promise<{
        paymentId: string;
        status: string;
    }>;
    /**
     * Get all payments (verification queue) with team info
     */
    getPaymentQueue(): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        teamId: string;
        verifiedAt: Date | null;
        amount: number;
        proofStorageKey: string | null;
        proofFilename: string | null;
        submittedBy: string;
        submittedAt: Date;
        verifiedBy: string | null;
        rejectionReason: string | null;
    }[]>;
};
//# sourceMappingURL=payment.service.d.ts.map