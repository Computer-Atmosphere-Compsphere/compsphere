import { Response } from "express";
import type { SSEEventType } from "@compsphere/types";

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  teamId?: string;
  role?: string;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();

  addClient(client: SSEClient): void {
    this.clients.set(client.id, client);
    console.log(`[SSE] Client connected: ${client.id} (total: ${this.clients.size})`);

    // Send initial heartbeat
    this.sendToClient(client.id, "heartbeat", { connected: true });
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`[SSE] Client disconnected: ${clientId} (total: ${this.clients.size})`);
  }

  /**
   * Broadcast to ALL connected clients
   */
  broadcast<T>(type: SSEEventType, data: T): void {
    const event = this.formatEvent(type, data);
    this.clients.forEach((client) => {
      try {
        client.res.write(event);
      } catch {
        this.removeClient(client.id);
      }
    });
  }

  /**
   * Send to a specific user's clients
   */
  sendToUser<T>(userId: string, type: SSEEventType, data: T): void {
    const event = this.formatEvent(type, data);
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        try {
          client.res.write(event);
        } catch {
          this.removeClient(client.id);
        }
      }
    });
  }

  /**
   * Send to all clients belonging to a team
   */
  sendToTeam<T>(teamId: string, type: SSEEventType, data: T): void {
    const event = this.formatEvent(type, data);
    this.clients.forEach((client) => {
      if (client.teamId === teamId) {
        try {
          client.res.write(event);
        } catch {
          this.removeClient(client.id);
        }
      }
    });
  }

  /**
   * Send to a specific client
   */
  sendToClient<T>(clientId: string, type: string, data: T): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.res.write(this.formatEvent(type as SSEEventType, data));
      } catch {
        this.removeClient(clientId);
      }
    }
  }

  private formatEvent<T>(type: string, data: T): string {
    return (
      `event: ${type}\n` +
      `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`
    );
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

// Singleton SSE service
export const sseService = new SSEService();

// Start periodic heartbeat to keep connections alive
setInterval(() => {
  sseService.broadcast("heartbeat", { clients: sseService.getClientCount() });
}, 30000);
