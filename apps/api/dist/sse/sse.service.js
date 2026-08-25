class SSEService {
    clients = new Map();
    addClient(client) {
        this.clients.set(client.id, client);
        console.log(`[SSE] Client connected: ${client.id} (total: ${this.clients.size})`);
        // Send initial heartbeat
        this.sendToClient(client.id, "heartbeat", { connected: true });
    }
    removeClient(clientId) {
        this.clients.delete(clientId);
        console.log(`[SSE] Client disconnected: ${clientId} (total: ${this.clients.size})`);
    }
    /**
     * Broadcast to ALL connected clients
     */
    broadcast(type, data) {
        const event = this.formatEvent(type, data);
        this.clients.forEach((client) => {
            try {
                client.res.write(event);
            }
            catch {
                this.removeClient(client.id);
            }
        });
    }
    /**
     * Send to a specific user's clients
     */
    sendToUser(userId, type, data) {
        const event = this.formatEvent(type, data);
        this.clients.forEach((client) => {
            if (client.userId === userId) {
                try {
                    client.res.write(event);
                }
                catch {
                    this.removeClient(client.id);
                }
            }
        });
    }
    /**
     * Send to all clients belonging to a team
     */
    sendToTeam(teamId, type, data) {
        const event = this.formatEvent(type, data);
        this.clients.forEach((client) => {
            if (client.teamId === teamId) {
                try {
                    client.res.write(event);
                }
                catch {
                    this.removeClient(client.id);
                }
            }
        });
    }
    /**
     * Send to a specific client
     */
    sendToClient(clientId, type, data) {
        const client = this.clients.get(clientId);
        if (client) {
            try {
                client.res.write(this.formatEvent(type, data));
            }
            catch {
                this.removeClient(clientId);
            }
        }
    }
    formatEvent(type, data) {
        return (`event: ${type}\n` +
            `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`);
    }
    getClientCount() {
        return this.clients.size;
    }
}
// Singleton SSE service
export const sseService = new SSEService();
// Start periodic heartbeat to keep connections alive
setInterval(() => {
    sseService.broadcast("heartbeat", { clients: sseService.getClientCount() });
}, 30000);
//# sourceMappingURL=sse.service.js.map