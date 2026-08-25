export declare const battleRoyaleService: {
    /**
     * Admin: initiate Battle Royale — opens the claiming window
     */
    initiate(adminId: string): Promise<{
        id: string;
        isActive: boolean;
        startedAt: Date | null;
        startedBy: string | null;
        endedAt: Date | null;
        createdAt: Date;
    }>;
    /**
     * Claim a slot — ATOMIC with SELECT FOR UPDATE to prevent over-booking.
     * This is the critical transaction that prevents concurrent over-claiming.
     */
    claimSlot(teamId: string, userId: string): Promise<{
        success: boolean;
        slotId: string;
        category: "NATIONAL" | "MIX" | "INTERNATIONAL";
        confirmationDeadline: Date;
        slots: {
            category: string;
            totalSlots: number;
            claimedSlots: number;
            availableSlots: number;
        }[];
    }>;
    getSlotCounts(configId: string): Promise<{
        category: string;
        totalSlots: number;
        claimedSlots: number;
        availableSlots: number;
    }[]>;
    getStatus(): Promise<{
        isActive: boolean;
        slots: never[];
        startedAt: null;
        startedBy: null;
        configId?: undefined;
    } | {
        isActive: boolean;
        configId: string;
        slots: {
            category: string;
            totalSlots: number;
            claimedSlots: number;
            availableSlots: number;
        }[];
        startedAt: Date | null;
        startedBy: string | null;
    }>;
};
//# sourceMappingURL=battleRoyale.service.d.ts.map