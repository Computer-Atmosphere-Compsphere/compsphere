export declare const scoringService: {
    /**
     * Get the judging weights from system config, or defaults.
     */
    getWeights(): Promise<{
        mvp: number;
        impact: number;
        creative: number;
        pitch: number;
    }>;
    /**
     * Submit or update a score for a team by a judge.
     * Ensures judge is assigned to team and scores are valid.
     */
    submitScore(userId: string, teamId: string, scores: {
        mvpScore: number;
        impactScore: number;
        creativeScore: number;
        pitchScore: number;
    }): Promise<{
        finalScore: number;
        id: string;
        updatedAt: Date;
        teamId: string;
        submittedAt: Date;
        judgeId: string;
        mvpScore: number;
        impactScore: number;
        creativeScore: number;
        pitchScore: number;
    }>;
    /**
     * Get team scoreboard with aggregated scores
     */
    getLeaderboard(): Promise<import("pg", { with: { "resolution-mode": "require" } }).QueryResult<Record<string, unknown>>>;
};
//# sourceMappingURL=scoring.service.d.ts.map