import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { IvrSimulatorService } from './ivr-simulator.service';

/**
 * IVR Alerts WebSocket Gateway
 * 
 * Broadcasts real-time IVR alerts to connected clinicians.
 * When a high-risk patient calls, all connected clinicians receive an alert.
 */

export interface IvrAlert {
  sessionId: string;
  timestamp: Date;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  patientType: 'prenatal' | 'neonatal';
  callerPhone: string;
  message: string;
  answers: Record<string, string>;
  riskScore: number;
  action: string;
}

@WebSocketGateway({
  namespace: 'ivr-alerts',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class IvrAlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IvrAlertsGateway.name);
  private connectedClinicians = new Map<string, { userId: string; district?: string }>();

  handleConnection(client: Socket) {
    this.logger.log(`Clinician connected: ${client.id}`);
    client.emit('connection', { message: 'Connected to IVR alerts' });
  }

  handleDisconnect(client: Socket) {
    this.connectedClinicians.delete(client.id);
    this.logger.log(`Clinician disconnected: ${client.id}`);
  }

  /**
   * Clinician joins alert channel
   * Optionally filter by district
   */
  @SubscribeMessage('join-alerts')
  handleJoinAlerts(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; district?: string },
  ) {
    this.connectedClinicians.set(client.id, {
      userId: data.userId,
      district: data.district,
    });
    this.logger.log(
      `Clinician ${data.userId} joined alerts${data.district ? ` for ${data.district}` : ''}`,
    );
    client.emit('joined', { message: 'Joined IVR alerts channel' });
  }

  /**
   * Broadcast a high-risk IVR alert to all connected clinicians
   */
  broadcastAlert(alert: IvrAlert) {
    this.logger.log(
      `Broadcasting IVR alert: ${alert.riskLevel} risk from ${alert.callerPhone}`,
    );

    // Broadcast to all connected clinicians
    this.server.emit('ivr-alert', {
      ...alert,
      timestamp: new Date(),
    });

    // Also emit to specific district if available
    if (alert.answers['district']) {
      this.server.emit(`ivr-alert:${alert.answers['district']}`, alert);
    }
  }

  /**
   * Send alert to specific clinician
   */
  sendAlertToClinician(clinicianId: string, alert: IvrAlert) {
    this.logger.log(`Sending alert to clinician ${clinicianId}`);
    this.server.to(clinicianId).emit('ivr-alert', alert);
  }

  /**
   * Get connected clinicians count
   */
  getConnectedCount(): number {
    return this.connectedClinicians.size;
  }

  /**
   * Get list of connected clinicians
   */
  getConnectedClinicians() {
    return Array.from(this.connectedClinicians.values());
  }
}
