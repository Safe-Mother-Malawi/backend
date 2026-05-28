import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export enum SocketEvent {
  ANALYTICS_UPDATED   = 'analytics:updated',
  ALERT_CREATED       = 'alert:created',
  PATIENT_REGISTERED  = 'patient:registered',
  APPOINTMENT_CHANGED = 'appointment:changed',
  EMERGENCY_ALERT     = 'emergency:alert',
  REMINDER_SENT       = 'reminder:sent',
  NOTIFICATION_RECEIVED = 'notification:received',
  REFERRAL_CREATED    = 'referral:created',
  REFERRAL_UPDATED    = 'referral:updated',
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialised');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /** Broadcast an event to all connected clients */
  emit(event: SocketEvent, payload?: Record<string, unknown>) {
    this.server.emit(event, payload ?? {});
  }
}
