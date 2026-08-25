export declare const submissionService: {
    /**
     * Get the configured submission deadline.
     */
    getDeadline(): Promise<Date>;
    /**
     * Submit Phase 2 deliverables for a team.
     * Atomically validates deadline and inserts/updates submission.
     */
    submit(teamId: string, userId: string, repositoryUrl: string, deploymentUrl: string | null, slideStorageKey: string | null, slideFilename: string | null, slideSizeBytes: number | null): Promise<{
        id: string;
        status: "SUBMITTED" | "DRAFT" | "LOCKED";
        teamId: string;
        submittedAt: Date;
        repositoryUrl: string;
        deploymentUrl: string | null;
        slideStorageKey: string | null;
        slideFilename: string | null;
        slideSizeBytes: number | null;
    }>;
    /**
     * Get all submissions (monitoring)
     */
    getSubmissions(): Promise<{
        id: string;
        status: "SUBMITTED" | "DRAFT" | "LOCKED";
        teamId: string;
        submittedAt: Date;
        repositoryUrl: string;
        deploymentUrl: string | null;
        slideStorageKey: string | null;
        slideFilename: string | null;
        slideSizeBytes: number | null;
        team: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teamCode: string;
            teamName: string;
            category: "NATIONAL" | "MIX" | "INTERNATIONAL";
            countryMix: string | null;
            originalRank: number;
            status: "NEW" | "TOP30" | "AWAITING_CONFIRMATION" | "PAYMENT_PENDING" | "DOCUMENT_PENDING" | "VERIFICATION_PENDING" | "VERIFIED" | "DROPPED" | "WAITLIST" | "FINALIST" | "SUBMISSION_OPEN" | "SUBMITTED" | "JUDGED";
            paymentRequired: boolean;
            paymentAmount: number;
            confirmationStartedAt: Date | null;
            confirmationDeadline: Date | null;
        };
    }[]>;
};
//# sourceMappingURL=submission.service.d.ts.map