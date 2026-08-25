import type { AttendanceType } from "@compsphere/types";
export declare const qrService: {
    /**
     * Generate a unique opaque QR token for a participant member.
     * Stores the hash in the database, returns raw token.
     */
    generateQRToken(teamId: string, userId: string): Promise<string>;
    /**
     * Validate a QR code token and record attendance.
     * Checks for duplication, invalidity, or team status.
     */
    scanQRToken(scannerId: string, rawToken: string, attendanceType: AttendanceType): Promise<{
        result: "INVALID";
        message: string;
        participant?: undefined;
    } | {
        result: "EXPIRED";
        message: string;
        participant?: undefined;
    } | {
        result: "NOT_ELIGIBLE";
        message: string;
        participant?: undefined;
    } | {
        result: "ALREADY_SCANNED";
        participant: {
            fullName: string;
            teamName: string;
            teamCode: string;
        };
        message: string;
    } | {
        result: "VALID";
        participant: {
            fullName: string;
            teamName: string;
            teamCode: string;
        };
        message: string;
    }>;
};
//# sourceMappingURL=qr.service.d.ts.map