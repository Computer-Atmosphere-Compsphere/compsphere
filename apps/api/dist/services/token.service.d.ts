export declare const tokenService: {
    /**
     * Redeem role access tokens (ADMIN or JUDGE).
     * Compares the input raw token with environment variables hashes
     * (to prevent plaintext DB storage or hardcoding in frontend)
     */
    redeemRoleToken(profileId: string, rawToken: string, requestedRole: "ADMIN" | "JUDGE"): Promise<{
        success: boolean;
        message: string;
        role?: undefined;
    } | {
        success: boolean;
        role: "ADMIN" | "JUDGE";
        message?: undefined;
    }>;
};
//# sourceMappingURL=token.service.d.ts.map