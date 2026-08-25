export declare const teamService: {
    /**
     * Redeem a team activation token.
     * Validates the token and returns team info + leader status.
     * DOES NOT grant access — just validates intent.
     */
    redeemTeamToken(rawToken: string): Promise<{
        tokenId: string;
        team: {
            id: string;
            teamName: string;
            teamCode: string;
            category: "NATIONAL" | "MIX" | "INTERNATIONAL";
            originalRank: number;
            status: "NEW" | "TOP30" | "AWAITING_CONFIRMATION" | "PAYMENT_PENDING" | "DOCUMENT_PENDING" | "VERIFICATION_PENDING" | "VERIFIED" | "DROPPED" | "WAITLIST" | "FINALIST" | "SUBMISSION_OPEN" | "SUBMITTED" | "JUDGED";
            paymentRequired: boolean;
            paymentAmount: number;
        };
        alreadyHasLeader: boolean;
    }>;
    /**
     * Activate a team with the requesting user as TEAM_LEADER.
     * Atomic: marks token as ACTIVATED + creates team membership.
     */
    activateAsLeader(profileId: string, teamId: string, tokenId: string): Promise<{
        membership: {
            id: string;
            status: "ACTIVE" | "PENDING" | "REMOVED";
            teamId: string;
            userId: string;
            role: "TEAM_LEADER" | "TEAM_MEMBER";
            joinedAt: Date;
            verifiedAt: Date | null;
        };
        deadline: Date;
    }>;
    /**
     * Join an already-activated team as a TEAM_MEMBER using a new ISSUED token.
     * The admin can regenerate tokens even after a team is activated, creating a fresh
     * ISSUED token that allows remaining members to join.
     */
    joinAsMember(profileId: string, teamId: string, tokenId: string): Promise<{
        membership: {
            id: string;
            status: "ACTIVE" | "PENDING" | "REMOVED";
            teamId: string;
            userId: string;
            role: "TEAM_LEADER" | "TEAM_MEMBER";
            joinedAt: Date;
            verifiedAt: Date | null;
        };
    }>;
    /**
     * Get full team details with members, proposals, payments, submissions,
     * access token, and attendance. Used by both the participant dashboard
     * and the admin / judge team detail views.
     */
    getTeamDetails(teamId: string): Promise<{
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
        members: {
            id: string;
            status: "ACTIVE" | "PENDING" | "REMOVED";
            teamId: string;
            userId: string;
            role: "TEAM_LEADER" | "TEAM_MEMBER";
            joinedAt: Date;
            verifiedAt: Date | null;
        }[];
        proposal: {
            files: {
                id: string;
                createdAt: Date;
                proposalId: string;
                storageKey: string;
                originalFilename: string;
                mimeType: string;
                sizeBytes: number;
            }[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            teamId: string;
            source: string;
            title: string;
            description: string | null;
            devpostUrl: string | null;
        } | null;
        payments: {
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
        }[];
        submissions: {
            id: string;
            status: "SUBMITTED" | "DRAFT" | "LOCKED";
            teamId: string;
            submittedAt: Date;
            repositoryUrl: string;
            deploymentUrl: string | null;
            slideStorageKey: string | null;
            slideFilename: string | null;
            slideSizeBytes: number | null;
        }[];
        attendance: {
            id: string;
            teamId: string;
            userId: string;
            attendanceType: "DAY1" | "DAY2" | "CEREMONY";
            attendanceDate: Date;
            scannedBy: string;
            scannedAt: Date;
        }[];
        token: {} | null;
    }>;
    /**
     * Admin: regenerate a team's activation token. Invalidates any previously
     * ISSUED tokens for the team and issues a fresh one. Returns the raw token
     * (only returned once — store securely and distribute to the team leader).
     */
    regenerateTeamToken(adminId: string, teamId: string): Promise<{
        tokenId: string;
        rawToken: string;
        expiresAt: Date | null;
    }>;
    /**
     * Admin: verify a team (move to VERIFIED)
     */
    verifyTeam(adminId: string, teamId: string): Promise<{
        teamId: string;
        newStatus: string;
    }>;
    /**
     * Admin: drop a team
     */
    dropTeam(adminId: string, teamId: string, reason?: string): Promise<{
        teamId: string;
        newStatus: string;
    }>;
    /**
     * Get admin overview metrics
     */
    getAdminMetrics(): Promise<{
        categories: Record<string, unknown>[];
        payments: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
        };
        submission_count: number;
        attendance_count: number;
        judging: {
            totalAssignments: number;
            totalScores: number;
            activeJudges: number;
        };
        recentActivity: Record<string, unknown>[];
    }>;
};
//# sourceMappingURL=team.service.d.ts.map