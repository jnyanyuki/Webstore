import { Response } from "express";

export interface NotificationEvent {
  type: string;
  event?: string;
  product_id?: string;
  order_id?: string;
  message?: string;
  payload?: any;
  data?: any;
  userId?: string;
  timestamp?: string;
}

interface SseClient {
  id: string;
  userId?: string;
  res: Response;
}

const sseClients: SseClient[] = [];

export class NotificationHub {
  static addClient(id: string, res: Response, userId?: string): void {
    sseClients.push({ id, res, userId });
  }

  static removeClient(id: string): void {
    const idx = sseClients.findIndex((c) => c.id === id);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  }

  static broadcast(event: NotificationEvent): void {
    const payload = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    sseClients.forEach((client) => {
      if (!event.userId || client.userId === event.userId) {
        try {
          client.res.write(message);
        } catch {
          // Client disconnected
        }
      }
    });
  }

  static getConnectedCount(): number {
    return sseClients.length;
  }
}
