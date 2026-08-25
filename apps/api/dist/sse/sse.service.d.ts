import { Response } from "express";
import type { SSEEventType } from "@compsphere/types";
interface SSEClient {
    id: string;
    res: Response;
    userId?: string;
    teamId?: string;
    role?: string;
}
declare class SSEService {
    private clients;
    addClient(client: SSEClient): void;
    removeClient(clientId: string): void;
    /**
     * Broadcast to ALL connected clients
     */
    broadcast<T>(type: SSEEventType, data: T): void;
    /**
     * Send to a specific user's clients
     */
    sendToUser<T>(userId: string, type: SSEEventType, data: T): void;
    /**
     * Send to all clients belonging to a team
     */
    sendToTeam<T>(teamId: string, type: SSEEventType, data: T): void;
    /**
     * Send to a specific client
     */
    sendToClient<T>(clientId: string, type: string, data: T): void;
    private formatEvent;
    getClientCount(): number;
}
export declare const sseService: SSEService;
export {};
//# sourceMappingURL=sse.service.d.ts.map